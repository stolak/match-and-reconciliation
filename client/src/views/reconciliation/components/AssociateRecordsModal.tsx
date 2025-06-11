import React from "react";
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
  matchedRecords: Record[];
  toggle: () => void;
}

const AssociateRecordsModal: React.FC<ActionModalProps> = ({
  isOpen,
  toggle,
  mainObject,
  matchedRecords,
}) => {
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

        <h5>List Items</h5>

        {/* Records Table */}
        <Table responsive>
          <thead>
            <tr>
              <th>S/N</th>
              <th>ID</th>
              <th>Description</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {matchedRecords.map((record, index) => (
              <tr key={record.id}>
                <td>{index + 1}</td>
                <td>{record.id}</td>
                <td>{record.fileDescription}</td>
                <td>{record.comparismDetails}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AssociateRecordsModal;
