import React, { useState } from "react";
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
import { Record } from "../../../types/Basic";
interface ActionModalProps {
  isOpen: boolean;
  isPrimary: boolean;
  mainObject: Record;
  unmatchedRecords: Record[];
  toggle: () => void;
  onSave: (selectedRecords: string[]) => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  toggle,
  isPrimary,
  mainObject,
  unmatchedRecords,
  onSave,
}) => {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleCheckboxChange = (id: string) => {
    setSelectedRecords((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((recordId) => recordId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSubmit = () => {
    onSave(selectedRecords);
    toggle();
    setSelectedRecords([]);
  };

  const filteredRecords = unmatchedRecords.filter(
    (record) =>
      record.fileDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.comparismDetails.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="xl"
      style={{ maxWidth: "80%" }}
    >
      <ModalHeader toggle={toggle}>Action Modal</ModalHeader>
      <ModalBody>
        <Form>
          <FormGroup>
            <Label for="recordId">ID</Label>
            <Input type="text" id="recordId" value={mainObject.id} readOnly />
          </FormGroup>
          <FormGroup>
            <Label for="recordDescription">Description</Label>
            <Input
              type="text"
              id="recordDescription"
              value={mainObject.fileDescription}
              readOnly
            />
          </FormGroup>
          <FormGroup>
            <Label for="recordDetails">Details</Label>
            <Input
              type="text"
              id="recordDetails"
              value={mainObject.comparismDetails}
              readOnly
            />
          </FormGroup>
        </Form>

        <h5>Unmatched Records</h5>

        {/* Search Input */}
        <FormGroup>
          <Label for="search">Search Records</Label>
          <Input
            type="text"
            id="search"
            placeholder="Search by ID or Description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FormGroup>

        {/* Records Table */}
        <Table responsive>
          <thead>
            <tr>
              <th>Select</th>
              <th>ID</th>
              <th>Description</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>
                  <Input
                    type="checkbox"
                    checked={selectedRecords.includes(record.id)}
                    onChange={() => handleCheckboxChange(record.id)}
                  />
                </td>
                <td>{record.id}</td>
                <td>{record.fileDescription}</td>
                <td>{record.comparismDetails}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleSubmit}>
          Submit
        </Button>
        <Button color="secondary" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ActionModal;
