import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  CardHeader,
  Form,
  FormGroup,
  Label,
  Spinner,
  Card,
  Input,
  Table,
} from "reactstrap";
import { Record } from "../../../types/Basic";
interface ActionModalProps {
  selectedRow: string;
  loading: boolean;
  isPrimary: boolean;
  selectedRecord: string;
  records: Record[];
  toggle: () => void;
  onSave: (id: string, selectedRecords: string[]) => void;
}

const ActionTable: React.FC<ActionModalProps> = ({
  loading,
  toggle,
  isPrimary,
  selectedRecord,
  records,
  onSave,
  selectedRow,
}) => {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]); // Deselect all if all are already selected
    } else {
      setSelectedRecords(records.map((record) => record.id)); // Select all
    }
  };
  const handleSelectRecord = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id)
        ? prev.filter((recordId) => recordId !== id)
        : [...prev, id]
    );
  };
  const handleSubmit = () => {
    if (selectedRecord) {
      onSave(selectedRecord, selectedRecords);
      setSelectedRecords([]);
    }
  };
  const extractHeaders = (records) => {
    // Extract unique field names from dynamicFields
    const dynamicFieldNames = new Set();
    records.forEach((record) =>
      record.dynamicFields.forEach((field) => dynamicFieldNames.add(field.name))
    );
    return [...Array.from(dynamicFieldNames)];
  };

  const getDynamicFieldValue = (dynamicFields, fieldName) => {
    const field = dynamicFields.find((f) => f.name === fieldName);
    return field ? field.value : "-";
  };
  const filteredRecords = records.filter(
    (record) =>
      record.fileDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.comparismDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setSelectedRecords([]);
  }, [selectedRecord]);
  const headers = extractHeaders(records);
  return (
    <Card className="shadow">
      <CardHeader className="border-0 d-flex align-items-center">
        <div className="col text-right">
          {selectedRecord && selectedRecords.length > 0 && (
            <Button
              color="warning"
              // disabled={loading}
              onClick={handleSubmit}
              size="sm"
            >
              Match
            </Button>
          )}
        </div>
      </CardHeader>
      <CardHeader className="border-0 d-flex align-items-center">
        <Input
          type="text"
          id="search"
          placeholder="Search or filter record(s)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                {/* <input
                type="checkbox"
                checked={selectedRecords.length === records.length}
                onChange={handleSelectAll}
              /> */}
              </th>
              <th>Description</th>
              {headers.map((header: string) => (
                <th>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                style={{
                  backgroundColor:
                    // selectedRow === record.id
                    record.matchId.includes(selectedRow)
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
                    disabled={record.matchId.length > 0}
                    checked={selectedRecords.includes(record.id)}
                    onChange={() => handleSelectRecord(record.id)}
                  />
                </td>
                <td>{record.fileDescription}</td>
                {headers.map((header: string) => (
                  <td key={header}>
                    {getDynamicFieldValue(record.dynamicFields, header)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
};

export default ActionTable;
