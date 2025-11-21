# pty — PDF → Excel utilities

Small utilities that extract tables from PDF files and save them as Excel files.

This folder contains:

- `app.py` — a small Flask app exposing POST /convert. Upload a PDF (form field `file`) and it returns `output.xlsx`.
- `extract_pdf_to_excel.py` — standalone script that reads `pdf.pdf` in this folder and writes `extracted_bank_statement2.xlsx`.
- `extract_all_pages_pdf_to_excel.py` — standalone script that combines tables across pages and writes `combined_bank_statement_all.xlsx`.
- `requirements.txt` — Python dependencies.

## Requirements

- Python 3.8+ (3.10/3.11 recommended)
- pip

Python dependencies (listed in `requirements.txt`):

- flask
- pandas
- pdfplumber
- openpyxl

## Setup (Windows PowerShell)

Open PowerShell and run the following from this folder:

```powershell
# go to the project folder
cd 'C:\Users\hp\Documents\GitHub\match-and-reconciliation\pty'

# create a virtual environment (one-time)
python -m venv .venv

# activate the venv for PowerShell
.\.venv\Scripts\Activate.ps1

# if activation fails due to execution policy, run (one-time as your user):
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# upgrade pip and install dependencies
python -m pip install --upgrade pip wheel
pip install -r requirements.txt
```

## Running the code

Run the Flask server (will listen on 0.0.0.0:5000):

```powershell
python app.py
```

The server expects a multipart POST to `/convert` with the field name `file`. It writes `output.xlsx` to the folder and returns it as an attachment.

Quick test using curl (from another PowerShell window while the server runs):

```powershell
curl -F "file=@C:\path\to\your\statement.pdf" http://127.0.0.1:5000/convert --output output.xlsx
```

Run the extractor scripts directly (they use a hard-coded `pdf.pdf` filename in this folder):

```powershell
# make sure a PDF named pdf.pdf exists in this folder, or edit the script to point at your file
python extract_pdf_to_excel.py
python extract_all_pages_pdf_to_excel.py
```

Outputs:

- `extracted_bank_statement2.xlsx` (from `extract_pdf_to_excel.py`)
- `combined_bank_statement_all.xlsx` (from `extract_all_pages_pdf_to_excel.py`)

## Troubleshooting

- If activation fails: run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` in PowerShell (requires no admin when scoped to CurrentUser).
- If pdfplumber or pandas fail to install: ensure `pip` and `wheel` are up-to-date (`python -m pip install --upgrade pip wheel`) and retry. On Windows, most wheels are prebuilt; if a build step is required, install the appropriate build tools (Visual C++ Build Tools).
- If extraction reports "No tables found": the PDF layout may not be tabular or `pdfplumber` may not detect the table. Consider manual review or using a different extraction approach.
- The Flask endpoint currently writes `output.xlsx` to disk and may be overwritten by concurrent requests. See the "Improvements" section.

## VS Code tips

- Open the repository in VS Code and set the interpreter to the virtual environment: Command Palette -> Python: Select Interpreter -> choose `.venv`.
- Use the Run and Debug view to add configurations for `app.py` or the extractor scripts. VS Code can auto-generate a `launch.json` for you.

## Suggested small improvements (I can implement on request)

- Add `argparse` to `extract_*.py` to accept input and output paths instead of hard-coded filenames.
- Stream the Excel output from `app.py` using an in-memory buffer (BytesIO) so files aren't written to disk.
- Make `app.py` generate unique filenames or use temporary files to avoid collisions.

If you'd like, tell me which improvement to implement and I'll add it and run a quick test.

---

Last updated: 2025-11-19
