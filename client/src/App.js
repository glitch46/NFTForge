import { useState } from "react";
import { Button, Container, Row, Col, Image, Form } from "react-bootstrap";
import ipfs from "./utils/ipfs";

import "./App.css";
import image from "./assets/logo.png";
import forgeButton from "./assets/forgeButton.png";
import uploadButton from "./assets/uploadButton.png";

function App() {
  // File
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);

  // Min Balance Condition
  const [option1Checked, setOption1Checked] = useState(false);
  const [tokenAddress, setTokenAddress] = useState(null);
  const [minBalance, setMinBalance] = useState(0);

  // Expiration Condition
  const [option2Checked, setOption2Checked] = useState(false);
  const [expirationTime, setExpirationTime] = useState(0);

  const loadFile = (_file) => {
    setFileName(_file.name);
    var reader = new FileReader();
    reader.readAsArrayBuffer(_file);
    reader.onloadend = () => {
      console.log(Buffer(reader.result));
      setFile(Buffer(reader.result));
    };
  };

  const addToIpfs = async () => {
    console.log("adding to IPFS...");
    const added = await ipfs.add(file, {
      progress: (prog) => console.log(`received: ${prog}`),
    });
    return added.cid.toString();
  };

  const createToken = async () => {
    console.log("Creating NFT...");

    // const ipfsHash = await addToIpfs();
    // console.log(ipfsHash);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center align-items-center">
        <Col className="align-self-center">
          <Image src={image} className="logo"></Image>
        </Col>
        <Col>
          {/* File Upload */}
          <div>
            {!file && (
              <>
                <div id="upload-container">
                  <div id="fileUpload">
                    <input
                      id="file"
                      type="file"
                      name="file"
                      className="inputfile"
                      onChange={(e) => loadFile(e.target.files[0])}
                    />
                    <label htmlFor="file" id="fileLabel">
                      <img src={uploadButton} className="upload-button" />
                    </label>
                  </div>
                </div>
                <p className="mt-4">
                  Please upload a PNG, GIF, WEBP, or MP4 Max 30mb
                </p>
              </>
            )}
            {fileName && (
              <label htmlFor="file" className="mb">
                <strong>File Uploaded: </strong>
                {fileName}
              </label>
            )}

            <Form className="mt-5">
              <Form.Group as={Row} controlId="formPlaintextPassword">
                <Form.Label column sm="3">
                  NFT Name
                </Form.Label>
                <Col sm="9" className="align-self-center">
                  <Form.Control type="text" placeholder="Eg. Blue ZUT Statue" />
                </Col>
              </Form.Group>

              <Form.Group as={Row} controlId="formPlaintextPassword">
                <Form.Label column sm="3">
                  Symbol
                </Form.Label>
                <Col sm="9" className="align-self-center">
                  <Form.Control type="text" placeholder="ZUT, ETH, ZRX ..." />
                </Col>
              </Form.Group>
            </Form>
            <p className="mt-5">
              Please add specialized properties to the NFT (select one or
              multiple):{" "}
            </p>
          </div>

          {/* Option 1: Min Balance in Owner Wallet */}
          <div className="ml-3">
            <Form.Check type={"checkbox"}>
              <Form.Check.Input
                type={"checkbox"}
                onChange={(e) => setOption1Checked(e.target.checked)}
              />
              <Form.Check.Label>{`Holder must hold specific quantity of tokens`}</Form.Check.Label>
            </Form.Check>

            {option1Checked && (
              <Form className="mt-2 ml-2">
                <Form.Group as={Row} controlId="formPlaintextPassword">
                  <Form.Label column sm="3">
                    Token Address
                  </Form.Label>
                  <Col sm="9" className="align-self-center">
                    <Form.Control
                      type="text"
                      placeholder="Eg. 0x514910771af9ca656af840dff83e8264ecf986ca"
                      onChange={(e) => setTokenAddress(e.target.value)}
                    />
                  </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="formPlaintextPassword">
                  <Form.Label column sm="3">
                    Minimum Balance
                  </Form.Label>
                  <Col sm="9" className="align-self-center">
                    <Form.Control
                      type="text"
                      placeholder="Eg. 1000"
                      onChange={(e) => setMinBalance(e.target.value)}
                    />
                  </Col>
                </Form.Group>
              </Form>
            )}
          </div>

          {/* Option 2: Expiration Time */}
          <div className="mt-4 ml-3">
            <Form.Check type={"checkbox"}>
              <Form.Check.Input
                type={"checkbox"}
                onChange={(e) => setOption2Checked(e.target.checked)}
              />
              <Form.Check.Label>{`NFT Auto Destructs on a timer`}</Form.Check.Label>
            </Form.Check>
            {option2Checked && (
              <Form className="mt-2 ml-2">
                <Form.Group as={Row} controlId="formPlaintextPassword">
                  <Form.Label column sm="3">
                    Expiration Time
                  </Form.Label>
                  <Col sm="9" className="align-self-center">
                    <Form.Control
                      type="number"
                      placeholder="Eg. 1608497905"
                      onChange={(e) => setExpirationTime(e.target.value)}
                    />
                  </Col>
                </Form.Group>
              </Form>
            )}
          </div>

          {/* Token Creation */}
          <div className="mt-4">
            <Image
              src={forgeButton}
              className="forge-button"
              onClick={createToken}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
