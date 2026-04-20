from flask import Flask, request, send_file
import pandas as pd
import pdfplumber
import os

app = Flask(__name__)

def extract_table_from_pdf(pdf_file):
    tables = []
    headers = None
    max_columns = 0  # To track the maximum number of columns

    with pdfplumber.open(pdf_file) as pdf:
        for page in pdf.pages:
            # Extract all tables from the page
            page_tables = page.extract_tables()
            if page_tables:
                for table in page_tables:
                    # Check if this table has the longest header
                    current_header = table[0]
                    if len(current_header) > max_columns:
                        # Update headers and reset tables for the longest table
                        headers = current_header
                        max_columns = len(current_header)
                        tables = table[1:]  # Store rows for this table
                    elif len(current_header) == max_columns:
                        # If the table matches the max column count, add its rows
                        tables.extend(table[1:])

    if not headers:
        return None  # No valid table found

    # Convert the extracted data to a DataFrame
    df = pd.DataFrame(tables, columns=headers)

    # Remove duplicate columns
    # df = df.loc[:, ~df.T.duplicated()]
    df = df.drop_duplicates()

    # Save the DataFrame to an Excel file
    output_excel_path = 'output.xlsx'
    df.to_excel(output_excel_path, index=False)
    return output_excel_path


@app.route('/convert', methods=['POST'])
def convert_pdf_to_excel():
    if 'file' not in request.files:
        return 'No file uploaded', 400

    pdf_file = request.files['file']
    print( pdf_file)
    output_excel = extract_table_from_pdf(pdf_file)
    
    if not output_excel:
        return 'Failed to extract tables', 500

    return send_file(output_excel, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
