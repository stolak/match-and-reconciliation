import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ActionModal from "./components/ActionModal";
import AssociateRecordsModal from "./components/AssociateRecordsModal";
import ActionTable from "./components/ActionTable";
import * as XLSX from "xlsx";
import { Record, FullRecords, FormattedData } from "../../types/Basic";
import UploadModal from "./components/UploadModal";
import PdfUploader from "./components/PdfUploader";

import {
  Card,
  CardHeader,
  Table,
  Container,
  Row,
  Progress,
  Input,
  Spinner,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Col,
  Button,
} from "reactstrap";
import Header from "components/Headers/Header";
import { sendRequest, HttpMethod } from "../../auth/authService";

interface ProjectType {
  refId?: string;
  projectDescription?: string;
  fileDescription?: string;
}
const baseUrl = process.env.REACT_APP_API_BASE_URL;
const ExcelUploads = () => {
  const { id } = useParams();

  const [isSource, setIsSource] = useState<boolean>(true);

  const [refId, setRefId] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(false); // New loading state
  const [records, setRecords] = useState<Record[]>([]);
  const [records2, setRecords2] = useState<Record[]>([]);
  const [source, setSource] = useState<Record[]>([]);
  const [target, setTarget] = useState<Record[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [dynamicHeaders, setDynamicHeaders] = useState<string[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [unmatchedRecords, setUnmatachedRecords] = useState<Record[]>([]);
  const [matchedRecords, setMatachedRecords] = useState<Record[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [mainObject, setMainObject] = useState<Record>({} as Record);
  const [projectObject, setProjectObject] = useState<ProjectType>(
    {} as ProjectType
  );
  const [fullRecords, setFullRecords] = useState<FullRecords>({
    refId: null,
    source: [],
    target: [],
  });

  // Modal state for controlling visibility
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);

  const handleDownloadExcel = () => {
    if (records.length === 0) {
      alert("No records available to download");
      return;
    }

    // Step 1: Extract dynamic field names for headers
    const dynamicFieldNames: string[] = [
      "fileDescription",
      ...new Set(
        records.flatMap((record) =>
          record.dynamicFields.map((field) => field.name)
        )
      ),
    ];

    // Step 2: Prepare the data in row format
    const sheetData: any[][] = [dynamicFieldNames]; // First row: headers

    // Step 3: Populate rows with data
    records.forEach((record) => {
      const row = [
        record.fileDescription, // First column: fileDescription
        ...dynamicFieldNames.slice(1).map((fieldName) => {
          const field = record.dynamicFields.find((f) => f.name === fieldName);
          return field ? field.value : ""; // Default to empty string if field not found
        }),
      ];
      sheetData.push(row);
    });

    // Step 4: Convert to worksheet and save as Excel
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      records[0].fileDescription
    );

    // Step 5: Export to Excel file with dynamic name
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    XLSX.writeFile(workbook, `${records[0].fileDescription}-${timestamp}.xlsx`);
  };

  const handleBulkReprocess = async () => {
    setLoading(true);
    try {
      await sendRequest(`compare/records/${id}`, HttpMethod.Post);
      fetchRecords(); // Fetch the updated records after reprocessing
    } catch (err) {
      console.error("Error during reprocessing:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id)
        ? prev.filter((recordId) => recordId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedRecords(
      selectedRecords.length === records.length ? [] : records.map((r) => r.id)
    );
  };

  const handleBulkDelete = () => {
    handleDelete(selectedRecords);
    setSelectedRecords([]);
  };

  const handleSubmit = async (uploadData: {
    refId?: string;
    projectDescription: string;
    fileDescription: string;
    fData: FormattedData[][];
  }) => {
    setLoading(true);
    const apiUrl = `compare/create-multiple`;
    const body = {
      refId: refId,
      source: {
        projectDescription: uploadData.projectDescription,
        fileDescription: uploadData.fileDescription,
        mutilpleDynamicFields: isSource ? uploadData.fData : [],
      },
      target: {
        projectDescription: uploadData.projectDescription,
        fileDescription: uploadData.fileDescription,
        mutilpleDynamicFields: isSource ? [] : uploadData.fData,
      },
    };
    try {
      const response = await sendRequest<FullRecords>(
        apiUrl,
        HttpMethod.Post,
        body
      );

      if (response.status === 201) {
        alert("File submitted successfully!");
        setFullRecords(response.data);
        setRefId(response.data?.refId);
      } else {
        alert("Failed to submit file.");
      }
    } catch (error) {
      console.error("Error submitting file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUpdate = async (id: string, matchId: string[]) => {
    setLoading(true); // Set loading to true when submit starts
    const apiUrl = `compare/update`;

    const body = {
      id,
      matchId,
    };

    try {
      const response = await sendRequest<Record>(apiUrl, HttpMethod.Post, body);
      if (response.status === 201) {
        alert("File submitted updated!");
        fetchRecords();
      } else {
        alert("Failed to submit file.");
      }
    } catch (error) {
      console.error("Error submitting file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    const doesExist = records.some(
      (record) => ids.includes(record.id) && record.matchId.length > 0
    );
    if (doesExist) {
      alert("one or more record already matched");
      return;
    }
    setLoading(true); // Set loading to true when submit starts

    try {
      const response = await sendRequest<{ message: string }>(
        `compare/delete`,
        HttpMethod.Post,
        { ids }
      );
      if (response.status === 201) {
        fetchRecords();
      } else {
        alert("Failed to submit file.");
      }
    } catch (error) {
      console.error("Error submitting file:", error);
    } finally {
      setLoading(false);
    }
  };
  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };
  const toggleViewModal = () => {
    setViewModalOpen(!viewModalOpen);
  };
  const toggleUploadModal = () => {
    setUploadModalOpen(!uploadModalOpen);
  };
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await sendRequest<FullRecords>(
        `compare/records-sources/${refId}`,
        HttpMethod.Get
      );
      setFullRecords(response.data);
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleMatching = (id: string) => {
    const findObject = records.find((record) => record.id === id);
    setMainObject(findObject || ({} as Record));
    const filteredRecords = isSource
      ? target.filter((record) => record.matchId.length === 0)
      : source.filter((record) => record.matchId.length === 0);
    setUnmatachedRecords(filteredRecords);
    toggleModal();
  };

  const beginUpload = () => {
    toggleUploadModal();
  };
  const handleNew = () => {
    setMainObject({} as Record);
    setProjectObject({} as ProjectType);
    setRefId(null);
    toggleUploadModal();
  };

  const handleView = (id: string) => {
    const findObject = records.find((record) => record.id === id);
    setMainObject(findObject || ({} as Record));
    const filteredRecords = isSource
      ? target.filter((record) => record.matchId.includes(id))
      : source.filter((record) => record.matchId.includes(id));
    setMatachedRecords(filteredRecords);
    toggleViewModal();
  };

  const getDynamicFieldValue = (dynamicFields, fieldName) => {
    const field = dynamicFields.find((f) => f.name === fieldName);
    return field ? field.value : "-";
  };
  const extractHeaders: any = (records: Record[]) => {
    // Extract unique field names from dynamicFields
    const dynamicFieldNames = new Set();
    records.forEach((record) =>
      record.dynamicFields.forEach((field) => dynamicFieldNames.add(field.name))
    );
    return [...Array.from(dynamicFieldNames)];
  };

  const filteredRecords = records.filter(
    (record) =>
      record.fileDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.comparismDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );
  useEffect(() => {
    const recs = isSource ? fullRecords.source : fullRecords.target;
    let finalrec = recs;

    const recs2 = isSource ? fullRecords.target : fullRecords.source;
    let finalrec2 = recs2;

    if (filter === "matched") {
      finalrec = recs.filter((record) => record.matchId.length > 0);
      finalrec2 = recs2.filter((record) => record.matchId.length > 0);
    }
    if (filter === "unmatched") {
      finalrec = recs.filter((record) => record.matchId.length === 0);
      finalrec2 = recs2.filter((record) => record.matchId.length === 0);
    }
    let findObject = finalrec.find((record) => record.refId === refId);
    if (!findObject) {
      findObject = isSource
        ? fullRecords.target.find((record) => record.refId === refId)
        : fullRecords.source.find((record) => record.refId === refId);
    }
    setProjectObject({
      refId: findObject?.id,
      projectDescription: findObject?.projectDescription,
      fileDescription: findObject?.fileDescription,
    });
    console.log(finalrec);
    setDynamicHeaders(extractHeaders(finalrec));
    setRecords(finalrec);
    setRecords2(finalrec2);
    setSource(fullRecords.source);
    setTarget(fullRecords.target);
  }, [fullRecords, isSource, filter]);

  useEffect(() => {
    if (id) {
      setRefId(id);
    }
  }, [id]);

  useEffect(() => {
    fetchRecords();
  }, [refId]);

  useEffect(() => {
    if (selectedRecords.length === 1) {
      const setrec = records.find(
        (record) =>
          record.id === selectedRecords[0] && record.matchId.length === 0
      );
      if (setrec) {
        setSelectedRecord(setrec.id);
      } else {
        setSelectedRecord(null);
      }
    } else {
      setSelectedRecord(null);
    }
  }, [selectedRecords]);
  return (
    <>
      <Header />
      {/* Page content */}
      <Container className="mt--7" fluid>
        <Row className="mt-5">
          <Col className="mb-5 mb-xl-0" xl="7">
            <Card className="shadow">
              <CardHeader className="border-0 d-flex align-items-center">
                <div className="col text-right">
                  {selectedRecords.length > 0 && (
                    <Button
                      color="danger" // Red for delete action
                      disabled={loading}
                      onClick={handleBulkDelete}
                      size="sm"
                    >
                      Delete
                    </Button>
                  )}

                  <Button
                    color="primary" // Blue for reprocessing (indicates an important action)
                    disabled={loading}
                    onClick={handleBulkReprocess}
                    size="sm"
                  >
                    Auto-Match
                  </Button>

                  <Button
                    color="success" // Green for upload (usually indicates success or go action)
                    disabled={loading}
                    onClick={beginUpload}
                    size="sm"
                  >
                    Upload
                  </Button>

                  <Button
                    color="secondary" // Grey for new action (less prominent)
                    disabled={loading}
                    onClick={handleNew}
                    size="sm"
                  >
                    New
                  </Button>

                  <Button
                    color="info" // Light blue for download (informational action)
                    disabled={loading}
                    onClick={handleDownloadExcel}
                    size="sm"
                  >
                    Download
                  </Button>
                </div>
              </CardHeader>

              <CardHeader className="border-0 d-flex align-items-center">
                <div className="d-flex align-items-center">
                  <div className="mr-4">
                    {["source", "target"].map((option) => (
                      <label key={option} className="mr-3">
                        <input
                          type="radio"
                          value={option}
                          checked={isSource === (option === "source")}
                          onChange={() => {
                            setIsSource(option === "source");
                            setSelectedRecords([]);
                            setSelectedRow(null);
                            setSelectedRecord(null);
                          }}
                          className="mr-1"
                        />
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </label>
                    ))}
                  </div>

                  {/* New group of buttons for Matched, Unmatched, All */}
                  <div className="mr-4">
                    <label className="mr-3">
                      <input
                        type="radio"
                        value="matched"
                        checked={filter === "matched"} // Replace 'filter' with your state variable
                        onChange={() => setFilter("matched")} // Replace 'setFilter' with your state updating function
                        className="mr-1"
                      />
                      Matched
                    </label>
                    <label className="mr-3">
                      <input
                        type="radio"
                        value="unmatched"
                        checked={filter === "unmatched"} // Replace 'filter' with your state variable
                        onChange={() => setFilter("unmatched")} // Replace 'setFilter' with your state updating function
                        className="mr-1"
                      />
                      Unmatched
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="all"
                        checked={filter === "all"} // Replace 'filter' with your state variable
                        onChange={() => setFilter("all")} // Replace 'setFilter' with your state updating function
                        className="mr-1"
                      />
                      All
                    </label>
                  </div>
                </div>
                <div className="col text-right">
                  <Input
                    type="text"
                    id="search"
                    placeholder="Search or filter record(s)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              {loading ? (
                <div className="text-center my-4">
                  <Spinner color="primary" />
                  <p>Loading...</p>
                </div>
              ) : (
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedRecords.length === records.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Description</th>

                      {dynamicHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => setSelectedRow(record.id)}
                        style={{
                          backgroundColor:
                            selectedRow === record.id
                              ? "#e9ecef"
                              : "transparent",
                          cursor: "pointer",
                          textDecoration:
                            record.matchId.length > 0 ? "line-through" : "none",
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={() => handleSelectRecord(record.id)}
                          />
                        </td>
                        <td>{record.fileDescription}</td>

                        {dynamicHeaders.map((header) => (
                          <td key={header}>
                            {getDynamicFieldValue(record.dynamicFields, header)}
                          </td>
                        ))}
                        <td className="text-right">
                          <UncontrolledDropdown>
                            <DropdownToggle
                              className="btn-icon-only text-light"
                              role="button"
                              size="sm"
                              color=""
                              onClick={(e) => e.preventDefault()}
                            >
                              <i className="fas fa-ellipsis-v" />
                            </DropdownToggle>
                            <DropdownMenu className="dropdown-menu-arrow" right>
                              {record.matchId.length > 0 ? (
                                <>
                                  <DropdownItem
                                    onClick={() => handleView(record.id)}
                                  >
                                    View Matched
                                  </DropdownItem>
                                  <DropdownItem
                                    onClick={() =>
                                      handleSubmitUpdate(record.id, [])
                                    }
                                  >
                                    Unmatch
                                  </DropdownItem>
                                </>
                              ) : (
                                <DropdownItem
                                  onClick={() => handleMatching(record.id)}
                                >
                                  Match
                                </DropdownItem>
                              )}
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Col>
          <Col className="mb-5 mb-xl-0" xl="5">
            <ActionTable
              selectedRow={selectedRow}
              loading={loading}
              toggle={toggleModal}
              isPrimary={isSource}
              selectedRecord={selectedRecord}
              records={records2}
              onSave={(id, selectedRecords) => {
                handleSubmitUpdate(id, selectedRecords);
                console.log("Selected Records:", selectedRecords);
              }}
            />
          </Col>
        </Row>
        <ActionModal
          isOpen={modalOpen}
          toggle={toggleModal}
          isPrimary={isSource}
          mainObject={mainObject}
          unmatchedRecords={unmatchedRecords}
          onSave={(selectedRecords) => {
            handleSubmitUpdate(mainObject.id, selectedRecords);
            console.log("Selected Records:", selectedRecords);
          }}
        />

        <AssociateRecordsModal
          isOpen={viewModalOpen}
          toggle={toggleViewModal}
          isPrimary={isSource}
          mainObject={mainObject}
          matchedRecords={matchedRecords}
        />
        {uploadModalOpen && (
          <UploadModal
            isOpen={uploadModalOpen}
            toggle={toggleUploadModal}
            isPrimary={isSource}
            mainObject={projectObject}
            onSave={(selectedRecords: {
              refId?: string;
              projectDescription: string;
              fileDescription: string;
              fData: FormattedData[][];
            }) => {
              console.log("Selected Records:", selectedRecords);
              handleSubmit(selectedRecords);
            }}
          />
        )}
      </Container>
    </>
  );
};

export default ExcelUploads;
