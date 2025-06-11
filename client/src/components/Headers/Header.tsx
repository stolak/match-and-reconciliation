import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardBody, CardTitle, Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { sendRequest, HttpMethod } from "../../auth/authService";
interface DistinctRef {
  description: string;
  refId: string;
  mainCount?: number;
  targetCount?: number;
  mainMatched?: number;
  targetMatched?: number;
}

const Header = () => {
  const [records, setRecords] = useState<DistinctRef[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await sendRequest<any>(
          "compare/distinct",
          HttpMethod.Get
        );
        setRecords(response.data);
      } catch (err) {
        console.error("Error fetching records:", err);
        setError("Failed to fetch records.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // if (loading) return <p>Loading...</p>;
  // if (error) return <p>{error}</p>;

  return (
    <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
      <Container fluid>
        <div className="header-body">
          <Row className="d-flex flex-nowrap overflow-auto">
            {records.slice(0, 4).map((record, index) => (
              <Col lg="6" xl="3" key={index}>
                <Link to={`/admin/lists/${record.refId}`}>
                  <Card className="card-stats mb-4 mb-xl-0 hover-zoom">
                    <CardBody>
                      <span className="h2 font-weight-bold mb-2 d-flex justify-content-center text-primary">
                        {record.description}
                      </span>
                      <Row>
                        <div className="col d-flex flex-column align-items-center border p-0 rounded shadow-sm mx-1">
                          <CardTitle
                            tag="h5"
                            className="text-uppercase text-muted mb-0 text-center"
                          >
                            Main
                          </CardTitle>
                          <span className="h3 font-weight-bold mb-0">
                            {record.mainCount}
                          </span>
                          <p className="mt-0 mb-0 text-muted text-sm text-center">
                            <span className="text-success mr-2">
                              <i className="fas fa-arrow-up" />{" "}
                              {record.mainCount > 0
                                ? Math.ceil(
                                    (record.mainMatched * 100) /
                                      record.mainCount
                                  )
                                : 0}
                              %
                            </span>
                            <span className="text-danger mr-2">
                              <i className="fas fa-arrow-down" />{" "}
                              {record.mainCount > 0
                                ? 100 -
                                  Math.ceil(
                                    (record.mainMatched * 100) /
                                      record.mainCount
                                  )
                                : 0}
                              %
                            </span>
                          </p>
                        </div>

                        <div className="col d-flex flex-column align-items-center border p-0 rounded shadow-sm mx-1">
                          <CardTitle
                            tag="h5"
                            className="text-uppercase text-muted mb-0 text-center"
                          >
                            Target
                          </CardTitle>
                          <span className="h3 font-weight-bold mb-0">
                            {record.targetCount}
                          </span>
                          <p className="mt-0 mb-0 text-muted text-sm text-center">
                            <span className="text-success mr-2">
                              <i className="fas fa-arrow-up" />{" "}
                              {record.targetCount > 0
                                ? Math.ceil(
                                    (record.targetMatched * 100) /
                                      record.targetCount
                                  )
                                : 0}
                              %
                            </span>
                            <span className="text-danger mr-2">
                              <i className="fas fa-arrow-down" />{" "}
                              {record.targetCount > 0
                                ? 100 -
                                  Math.ceil(
                                    (record.targetMatched * 100) /
                                      record.targetCount
                                  )
                                : 0}
                              %
                            </span>
                          </p>
                        </div>
                      </Row>
                    </CardBody>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default Header;
