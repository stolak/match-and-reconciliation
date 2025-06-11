import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FormattedData } from "../../../types/Basic";
import axios from "axios";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Table,
} from "reactstrap";

interface ProjectType {
  refId?: string;
  projectDescription?: string;
  fileDescription?: string;
}

interface ActionModalProps {
  isOpen: boolean;
  isPrimary: boolean;
  mainObject: ProjectType;
  toggle: () => void;
  onSave: (selectedRecords: {
    refId?: string;
    projectDescription: string;
    fileDescription: string;
    fData: FormattedData[][];
  }) => void;
}

const UploadModal: React.FC<ActionModalProps> = ({
  isOpen,
  toggle,
  mainObject: initialMainObject,
  onSave,
}) => {
  const [mainObject, setMainObject] = useState<ProjectType>(initialMainObject);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [fileData, setFileData] = useState<FormattedData[][]>([]);
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type;

      if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileType === "application/vnd.ms-excel"
      ) {
        excelExtraction(file);
      } else if (fileType === "application/pdf") {
        handlePDFToExcel(file);
      } else {
        console.error(
          "Unsupported file type. Please upload an Excel or PDF file."
        );
      }
    }
  };

  const handlePDFToExcel = async (file) => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    if (!file) {
      setMessage("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setFileName(file.name);
    try {
      // Make an API request to upload the file
      const response = await axios.post(
        `${baseUrl}/pdf-to-excel/upload`,
        formData,
        {
          responseType: "blob", // To handle binary data (Excel file)
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      excelExtraction(response.data);
      // Create a download link for the Excel file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${file.name}.xlsx`); // File name
      document.body.appendChild(link);
      link.click();
      setMessage("File uploaded and converted successfully!");
    } catch (error) {
      console.error("Error uploading file:", error.message);
      setMessage("Failed to upload or convert the file.");
    }
  };

  const excelExtraction = (fileData: Blob) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target?.result as string;

      // Process the binary string using XLSX
      const workbook = XLSX.read(binaryStr, {
        type: "binary",
        cellDates: true,
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Read the sheet as a 2D array
      const data: (string | number | Date)[][] = XLSX.utils.sheet_to_json(
        worksheet,
        { header: 1 }
      );

      if (data.length === 0) {
        console.warn("No data in the sheet");
        setHeaders([]);
        setSelectedHeaders([]);
        setFileData([]);
        return;
      }

      let extractedHeaders: string[] | undefined = undefined;
      let bodyData: (string | number | Date)[][] = [];

      // Iterate over rows to find a valid header
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (
          row.every(
            (cell) =>
              cell !== undefined && cell !== null && String(cell).trim() !== ""
          )
        ) {
          extractedHeaders = row as string[]; // Valid header found
          bodyData = data.slice(i + 1); // Remaining rows are the body
          break;
        }
      }

      if (!extractedHeaders) {
        console.warn("No valid headers found in the sheet");
        setHeaders([]);
        setSelectedHeaders([]);
        setFileData([]);
        return;
      }

      // Set headers and map the body data
      setHeaders(extractedHeaders);
      setSelectedHeaders(extractedHeaders);
      setFileData(
        bodyData.map((row) =>
          extractedHeaders!.map((header, index) => ({
            name: header,
            value: row[index] || "",
          }))
        )
      );
    };

    reader.onerror = (error) => {
      setHeaders([]);
      setSelectedHeaders([]);
      setFileData([]);
      console.error("Error reading file:", error);
    };

    // Read the blob as a binary string
    reader.readAsBinaryString(fileData);
  };

  const handleHeaderSelection = (header: string) => {
    setSelectedHeaders((prevSelected) =>
      prevSelected.includes(header)
        ? prevSelected.filter((h) => h !== header)
        : [...prevSelected, header]
    );
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof ProjectType
  ) => {
    setMainObject({
      ...mainObject,
      [name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    const filteredData = fileData.map((row) =>
      row.filter((cell) => selectedHeaders.includes(cell.name))
    );
    onSave({
      refId: mainObject.refId,
      projectDescription: mainObject.projectDescription,
      fileDescription: mainObject.fileDescription || "",
      fData: filteredData,
    });
    toggle();
    setMainObject({} as ProjectType);
  };

  // Clear file data, headers, and filename
  const handleClearFile = () => {
    setFileName("");
    setHeaders([]);
    setFileData([]);
    setSelectedHeaders([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="xl"
      style={{ maxWidth: "80%" }}
    >
      <ModalHeader toggle={toggle}></ModalHeader>
      <ModalBody>
        <h4 className="font-weight-bold text-center mb-4">
          Upload Project Details
        </h4>
        <Form>
          <Form className="d-flex align-items-center">
            <FormGroup className="mr-4 flex-grow-1">
              <Label for="recordId">Project Description</Label>
              <Input
                type="text"
                id="recordId"
                value={mainObject.projectDescription}
                onChange={(e) =>
                  handleDescriptionChange(e, "projectDescription")
                }
                name="projectDescription"
                readOnly={!!mainObject.refId}
              />
            </FormGroup>
            <FormGroup className="flex-grow-1">
              <Label for="fileDescription">Files Description</Label>
              <Input
                type="text"
                id="fileDescription"
                name="fileDescription"
                value={mainObject.fileDescription || ""}
                onChange={(e) => handleDescriptionChange(e, "fileDescription")}
              />
            </FormGroup>
          </Form>
        </Form>

        {/* Centered File Upload Button */}
        <div className="d-flex justify-content-center align-items-center my-4">
          <label className="btn btn-primary">
            Choose File
            <input
              type="file"
              accept=".xlsx, .xls, .pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          {fileName && <span className="ml-2">{fileName}</span>}
        </div>

        {/* Conditionally Render Headers and Table */}
        {fileData.length > 0 && (
          <>
            {headers.length > 0 && (
              <div className="mt-4">
                <h5>Select Columns to Include:</h5>
                <div className="d-flex flex-wrap mt-2">
                  {headers.map((header) => (
                    <label
                      key={header}
                      className="mr-3 d-flex align-items-center"
                    >
                      <input
                        type="checkbox"
                        checked={selectedHeaders.includes(header)}
                        onChange={() => handleHeaderSelection(header)}
                        className="mr-1"
                      />
                      {header}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Table className="align-items-center table-flush mt-4" responsive>
              <thead className="thead-light">
                <tr>
                  {Object.values(fileData[0])
                    .filter((cell) => selectedHeaders.includes(cell.name))
                    .map((value, index) => (
                      <th key={index} scope="col">
                        {value.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {fileData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row
                      .filter((cell) => selectedHeaders.includes(cell.name))
                      .map((cell, cellIndex) => (
                        <td
                          key={`${rowIndex}-${cellIndex}`}
                        >{`${cell.value}`}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </ModalBody>

      <ModalFooter>
        {fileData.length > 0 && (
          <>
            <Button color="primary" onClick={handleSubmit}>
              Submit
            </Button>

            <Button color="warning" onClick={handleClearFile}>
              Reset
            </Button>
          </>
        )}
        <Button color="secondary" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UploadModal;
