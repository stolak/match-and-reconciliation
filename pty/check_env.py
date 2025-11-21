import sys
import os
import shutil

def check_environment():
    print("=== Environment Check ===")
    print(f"Python: {sys.version}")
    print(f"Platform: {sys.platform}")
    
    # Check Tesseract
    tesseract_path = shutil.which("tesseract")
    if tesseract_path:
        print(f"✅ Tesseract found at: {tesseract_path}")
    else:
        print("❌ Tesseract NOT found in PATH")
        # Check common Windows locations
        common_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            r"C:\Users\hp\AppData\Local\Tesseract-OCR\tesseract.exe"
        ]
        for path in common_paths:
            if os.path.exists(path):
                print(f"   Found at (but not in PATH): {path}")
                print("   -> You need to add this folder to your system PATH or configure it in the code.")

    # Check Poppler (pdftoppm is part of poppler)
    poppler_path = shutil.which("pdftoppm")
    if poppler_path:
        print(f"✅ Poppler found at: {poppler_path}")
    else:
        print("❌ Poppler NOT found in PATH (required for pdf2image)")
        print("   -> Download from: https://github.com/oschwartz10612/poppler-windows/releases/")
        print("   -> Extract and add the 'bin' folder to your system PATH")

    # Check Python packages
    print("\n=== Python Packages ===")
    try:
        import pdfplumber
        print(f"✅ pdfplumber: {pdfplumber.__version__}")
    except ImportError:
        print("❌ pdfplumber: Not installed")

    try:
        import pytesseract
        print(f"✅ pytesseract: {pytesseract.__version__}")
    except ImportError:
        print("❌ pytesseract: Not installed")

    try:
        import pdf2image
        print(f"✅ pdf2image: Installed")
    except ImportError:
        print("❌ pdf2image: Not installed")

if __name__ == "__main__":
    check_environment()
