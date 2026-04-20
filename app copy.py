from flask import Flask, request, send_file
import pandas as pd
import pdfplumber
import os
import warnings
import sys
import tempfile
import uuid
from contextlib import redirect_stderr
from io import StringIO
try:
    import pytesseract
    from pdf2image import convert_from_path
    HAS_OCR = True
except ImportError:
    HAS_OCR = False
    print("Warning: pytesseract or pdf2image not installed. OCR will be disabled.")

# Suppress pdfplumber/pdfminer warnings about color patterns
warnings.filterwarnings('ignore', category=UserWarning)
import logging
logging.getLogger('pdfminer').setLevel(logging.ERROR)

app = Flask(__name__)

# Configure Tesseract path if needed (Windows usually requires this)
tesseract_cmd_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(tesseract_cmd_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd_path
    print(f"Configured Tesseract at: {tesseract_cmd_path}")
else:
    # Check common 32-bit path
    tesseract_cmd_path_x86 = r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'
    if os.path.exists(tesseract_cmd_path_x86):
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd_path_x86
        print(f"Configured Tesseract at: {tesseract_cmd_path_x86}")

def extract_text_with_ocr(pdf_path):
    if not HAS_OCR:
        print("OCR tools not installed (pytesseract/pdf2image), skipping OCR extraction")
        return None
        
    print("Attempting OCR extraction...")
    try:
        # Check if poppler is installed/in path
        try:
            images = convert_from_path(pdf_path)
        except Exception as e:
            print(f"Poppler error: {e}")
            print("Please install Poppler and add it to PATH: https://github.com/oschwartz10612/poppler-windows/releases/")
            return None

        text_data = []
        
        for i, image in enumerate(images):
            print(f"OCR processing page {i+1}...")
            # Use simpler page segmentation for table-like data
            custom_config = r'--psm 6'
            text = pytesseract.image_to_string(image, config=custom_config)
            
            lines = text.split('\n')
            for line in lines:
                if line.strip():
                    # Split by spaces - this is tricky with OCR but we'll try best effort
                    # Assuming 2+ spaces or tabs separate columns
                    parts = [p.strip() for p in line.split('  ') if p.strip()]
                    if len(parts) < 2:
                         parts = [p.strip() for p in line.split('\t') if p.strip()]
                    
                    # If still single column, might be space separated
                    if len(parts) < 2 and len(line.split()) > 1:
                        # Heuristic: if likely a table row (dates, numbers), split by space
                        parts = line.split()
                        
                    if len(parts) > 1:
                        text_data.append(parts)
                        
        return text_data
    except Exception as e:
        print(f"OCR failed: {e}")
        return None

def extract_table_from_pdf(pdf_file):
    try:
        # Save uploaded PDF to temporary file
        temp_pdf_path = os.path.join(tempfile.gettempdir(), f'temp_pdf_{uuid.uuid4().hex}.pdf')
        pdf_content = pdf_file.read()
        
        if not pdf_content:
            print("Error: Empty PDF file")
            return None
            
        with open(temp_pdf_path, 'wb') as temp_file:
            temp_file.write(pdf_content)
        
        # First pass: collect all tables and find the most common column count
        all_tables = []
        column_counts = {}
        tables = []
        headers = None

        # Suppress stderr warnings from pdfplumber/pdfminer
        stderr_buffer = StringIO()
        with redirect_stderr(stderr_buffer):
            with pdfplumber.open(temp_pdf_path) as pdf:
                print(f"PDF has {len(pdf.pages)} pages")
                
                # First pass: collect all tables
                for page_num, page in enumerate(pdf.pages):
                    page_tables = page.extract_tables()
                    print(f"Page {page_num + 1}: Found {len(page_tables) if page_tables else 0} table(s)")
                    
                    if page_tables:
                        for table in page_tables:
                            if table and len(table) > 0:
                                col_count = len(table[0])
                                all_tables.append((page_num, table))
                                data_rows = len(table) - 1
                                column_counts[col_count] = column_counts.get(col_count, 0) + data_rows
                                print(f"  Table: {len(table)} rows, {col_count} columns")
                
                print(f"Total tables: {len(all_tables)}")
                print(f"Column distribution: {column_counts}")
                
                # If no tables found, try text extraction
                if not column_counts:
                    print("No tables found, trying text extraction...")
                    text_data = []
                    for page_num, page in enumerate(pdf.pages):
                        page_text = page.extract_text()
                        if page_text and page_text.strip():
                            lines = page_text.strip().split('\n')
                            print(f"Page {page_num + 1}: {len(lines)} lines of text")
                            for line in lines:
                                if line.strip():
                                    # Try splitting by tabs or multiple spaces
                                    if '\t' in line:
                                        parts = [p.strip() for p in line.split('\t') if p.strip()]
                                    else:
                                        parts = [p.strip() for p in line.split('  ') if p.strip()]
                                        if len(parts) < 2:
                                            parts = [p.strip() for p in line.split() if len(p.strip()) > 1]
                                    
                                    if len(parts) > 1:
                                        text_data.append(parts)
                    
                    if text_data:
                        print(f"Extracted {len(text_data)} text-based rows")
                        max_cols = max(len(row) for row in text_data)
                        filtered_data = [row for row in text_data if len(row) == max_cols]
                        if filtered_data:
                            headers = filtered_data[0]
                            tables = filtered_data[1:] if len(filtered_data) > 1 else []
                            print(f"Using text: {len(tables)} rows, {len(headers)} columns")
                        else:
                            print("Could not structure text data")
                            return None
                    else:
                        print("No extractable data found")
                        return None
                else:
                    # Use the most common column count
                    target_column_count = max(column_counts.items(), key=lambda x: x[1])[0]
                    print(f"Using column count: {target_column_count} (most common)")
                    
                    # Second pass: extract matching tables
                    for page_num, table in all_tables:
                        if len(table) > 0 and len(table[0]) == target_column_count:
                            if headers is None:
                                headers = table[0]
                                print(f"Headers: {headers}")
                            
                            if len(table) > 1:
                                # Log a sample row to check content
                                if len(tables) == 0:
                                    print(f"Sample data row from page {page_num + 1}: {table[1]}")
                                
                                tables.extend(table[1:])
                                print(f"Added {len(table) - 1} rows from page {page_num + 1}")

        # Clean up temp file
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)

        if not headers or not tables:
            print("No valid data extracted")
            return None

        # Check if data is actually empty (scanned PDF issue)
        has_content = False
        for row in tables:
            for cell in row:
                if cell and str(cell).strip():
                    has_content = True
                    break
            if has_content:
                break
        
        if not has_content:
            print("WARNING: Extracted tables but found no text content. This PDF might be scanned/image-based.")
            
            # Try OCR fallback
            if HAS_OCR:
                print("Falling back to OCR...")
                ocr_data = extract_text_with_ocr(temp_pdf_path)
                
                if ocr_data:
                    print(f"OCR extracted {len(ocr_data)} rows")
                    # Use row with max columns as template for header
                    max_cols = max(len(row) for row in ocr_data)
                    filtered_data = [row for row in ocr_data if len(row) >= max_cols - 1] # Allow some flexibility
                    
                    if filtered_data:
                        headers = filtered_data[0]
                        tables = filtered_data[1:]
                        print(f"Using OCR data: {len(tables)} rows")
                        
                        # Reset flag since we have new content
                        has_content = True
                    else:
                        print("OCR extracted text but couldn't structure it")
                        return None
                else:
                    print("OCR extracted no data")
                    return None
            else:
                return None

        # Generate default headers if needed
        if not headers or all(not h or str(h).strip() == '' for h in headers):
            num_columns = len(tables[0]) if tables else 0
            headers = [f"Column_{i+1}" for i in range(num_columns)]
            print(f"Generated default headers: {headers}")

        # Clean headers
        cleaned_headers = []
        for idx, header in enumerate(headers):
            if header and str(header).strip():
                cleaned_headers.append(str(header).strip())
            else:
                cleaned_headers.append(f"Column_{idx + 1}")

        print(f"Final data: {len(tables)} rows, {len(cleaned_headers)} columns")

        # Convert to DataFrame
        df = pd.DataFrame(tables, columns=cleaned_headers)
        
        # Show first few rows in log
        print("DataFrame Head:")
        print(df.head())

        # Save to Excel
        output_excel_path = 'output.xlsx'
        df.to_excel(output_excel_path, index=False)
        print(f"Saved {len(df)} rows to {output_excel_path}")
        return output_excel_path
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None


@app.route('/convert', methods=['POST'])
def convert_pdf_to_excel():
    if 'file' not in request.files:
        return 'No file uploaded', 400

    pdf_file = request.files['file']
    output_excel = extract_table_from_pdf(pdf_file)

    if not output_excel:
        return 'Failed to extract tables', 500

    return send_file(output_excel, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
