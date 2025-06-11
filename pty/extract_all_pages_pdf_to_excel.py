import pandas as pd
import pdfplumber

def extract_table_from_pdf(pdf_path, output_excel_path):
    # List to store data from all tables across pages
    combined_data = []
    headers = None
    
    # Open the PDF file using pdfplumber
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Extract table from each page
            table = page.extract_table()
            
            # If a table is found, process it
            if table:
                # Extract headers from the first table on the first page
                if headers is None:
                    headers = table[0]  # First row as headers
                
                # Append the rows to combined_data (excluding the header row)
                combined_data.extend(table[1:])
    
    # Convert the combined data to a DataFrame
    if combined_data and headers:
        df = pd.DataFrame(combined_data, columns=headers)
    else:
        print("No tables found in the PDF.")
        return

    # Save the DataFrame to an Excel file
    df.to_excel(output_excel_path, index=False)
    print(f"Data successfully extracted from all pages and saved to {output_excel_path}")

# Specify the input PDF file and output Excel file
pdf_path = r'pdf.pdf'
output_excel_path = 'combined_bank_statement_all.xlsx'

# Run the extraction function
extract_table_from_pdf(pdf_path, output_excel_path)
