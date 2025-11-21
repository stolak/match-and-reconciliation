import os
import pandas as pd
import pdfplumber

def extract_table_from_pdf(pdf_path, output_excel_path):
    # Check if the file exists
    if not os.path.exists(pdf_path):
        print(f"Error: The file '{pdf_path}' does not exist.")
        return
    
    # List to store all extracted tables
    tables = []
    
    try:
        # Open the PDF file using pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # Extract table from each page
                table = page.extract_table()
                
                # If a table is found, add it to the list
                if table:
                    tables.append(table)
    except Exception as e:
        print(f"Failed to read PDF: {e}")
        return

    # Convert the extracted table to a DataFrame
    if tables:
        headers = tables[0][0]
        data = tables[0][1:]
        df = pd.DataFrame(data, columns=headers)
    else:
        print("No tables found in the PDF.")
        return

    # Save the DataFrame to an Excel file
    try:
        df.to_excel(output_excel_path, index=False)
        print(f"Data successfully extracted and saved to {output_excel_path}")
    except Exception as e:
        print(f"Failed to save Excel file: {e}")

# Specify the input PDF file and output Excel file
#pdf_path = r'C:/Users/user/Desktop/bank statement.pdf'
pdf_path = r'april.pdf'
output_excel_path = 'extracted_bank_statement2.xlsx'

# Run the extraction function
extract_table_from_pdf(pdf_path, output_excel_path)
