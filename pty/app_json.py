from flask import Flask, request, jsonify
import pandas as pd
import pdfplumber

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
                    if not table:
                        continue
                        
                    # Experiment: Check if first column has too many empty values
                    # If the first column is mostly empty, ignore the table
                    if len(table) > 1:
                        col0_values = [row[0] for row in table]
                        empty_count = sum(1 for x in col0_values if x is None or str(x).strip() == "")
                        # If more than 30% of the first column is empty, skip this table
                        if empty_count / len(table) > 0.3:
                            print("Skipping table")
                            continue

                    # Check if this table has the longest header
                    # We look at the width of the table (number of columns)
                    num_cols = len(table[0])
                    
                    if num_cols > max_columns:
                        # Found a wider table. Determine which row is the header.
                        max_columns = num_cols
                        
                        # Helper to count non-empty cells
                        def count_valid_cells(row):
                            return sum(1 for x in row if x and str(x).strip())
                        
                        # Default to first row
                        header_index = 0
                        
                        # Check if second row is a better header candidate
                        # (has more non-empty values or first row is mostly empty)
                        if len(table) > 1:
                            valid_0 = count_valid_cells(table[0])
                            valid_1 = count_valid_cells(table[1])
                            
                            # If row 1 has more valid cells than row 0, use row 1
                            if valid_1 > valid_0:
                                header_index = 1
                        
                        headers = table[header_index]
                        tables = table[header_index+1:]
                        
                    elif num_cols == max_columns:
                        # If the table matches the max column count, add its rows
                        # We need to skip header rows if they repeat
                        
                        # Check if row 0 matches our detected headers
                        if table[0] == headers:
                            tables.extend(table[1:])
                        # Check if row 1 matches (in case of double-header rows on subsequent pages)
                        elif len(table) > 1 and table[1] == headers:
                            tables.extend(table[2:])
                        else:
                            # If no exact match, just assume 1 header row (standard)
                            # or check if row 0 is likely a header (mostly strings, matches schema)
                            # For safety, we'll append from row 1 if row 0 looks like a header
                            tables.extend(table[1:])

    if not headers:
        return None  # No valid table found

    # Clean headers: replace None/empty with default names, ensure string type, replace spaces with underscores
    cleaned_headers = []
    for i, h in enumerate(headers):
        if h is None or str(h).strip() == "":
            cleaned_headers.append(f"Column_{i}")
        else:
            # Replace spaces with underscores and strip whitespace
            clean_h = str(h).strip().replace(' ', '_').replace('\n', '_')
            cleaned_headers.append(clean_h)

    # Convert the extracted data to a DataFrame
    df = pd.DataFrame(tables, columns=cleaned_headers)

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Convert to JSON records
    # Replace NaN with None for valid JSON
    df = df.where(pd.notnull(df), None)
    json_data = df.to_dict(orient='records')
    return json_data


@app.route('/convert', methods=['POST'])
def convert_pdf_to_json():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_file = request.files['file']
    print(pdf_file)
    json_output = extract_table_from_pdf(pdf_file)
    
    if json_output is None:
        return jsonify({"error": "Failed to extract tables"}), 500

    return jsonify(json_output)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
