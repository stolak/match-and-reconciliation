import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

function PdfUploader() {
  const [file, setFile] = useState(null); // To store the selected file
  const [message, setMessage] = useState("");

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("before");
      // Make an API request to upload the file
      const response = await axios.post(
        "http://127.0.0.1:3000/pdf-to-excel/upload",
        formData,
        {
          responseType: "blob", // To handle binary data (Excel file)
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("After");
      //console.log("start convertion", response.data);
      handleFileUpload(response.data);
      console.log("complete convertion");
      // Create a download link for the Excel file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "converted_data.xlsx"); // File name
      document.body.appendChild(link);
      link.click();
      setMessage("File uploaded and converted successfully!");
    } catch (error) {
      console.error("Error uploading file:", error.message);
      setMessage("Failed to upload or convert the file.");
    }
  };

  const handleFileUpload = (fileData: Blob) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target?.result as string;

      // Process the binary string using XLSX
      const workbook = XLSX.read(binaryStr, {
        type: "binary",
        cellDates: true,
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Specify the type of the data
      const data: (string | number | Date)[][] = XLSX.utils.sheet_to_json(
        worksheet,
        { header: 1 }
      );

      if (data.length < 2) {
        console.warn("Insufficient data in the sheet");
        return;
      }

      // Extract headers and data
      const extractedHeaders = data[1] as string[]; // Ensure second row is treated as headers

      console.log(
        data.slice(2).map((row) =>
          extractedHeaders.map((header, index) => ({
            name: header,
            value: row[index] || "",
          }))
        )
      );
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };

    // Read the blob as a binary string
    reader.readAsBinaryString(fileData);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Upload PDF</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </div>
        <button type="submit">Upload and Convert</button>
      </form>
      {message && <p style={{ marginTop: "20px", color: "blue" }}>{message}</p>}
    </div>
  );
}

export default PdfUploader;
