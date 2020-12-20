import { useState } from "react";
import { Button, Container, Row, Col, Image, Form } from "react-bootstrap";
import ipfs from "./utils/ipfs";

import "./App.css";
import image from "./assets/logo.png";
import forgeButton from "./assets/forgeButton.png";

function App() {
  const [ipfsHash, setIpfsHash] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);

  console.log(file);

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
    setIpfsHash(added.cid.toString());

    console.log(ipfsHash);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center align-items-center">
        <Col className="align-self-center">
          <Image src={image} className="logo"></Image>
        </Col>
        <Col>
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
                  <label for="file" id="fileLabel">
                    Upload
                  </label>
                </div>
              </div>
              <p>Please upload a PNG, GIF, WEBP, or MP4 Max 30mb</p>
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
              <Form.Label column sm="2">
                NFT Name
              </Form.Label>
              <Col sm="10">
                <Form.Control type="text" placeholder="Eg. Blue ZUT Statue" />
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="formPlaintextPassword">
              <Form.Label column sm="2">
                Symbol
              </Form.Label>
              <Col sm="10">
                <Form.Control type="text" placeholder="ZUT, ETH, ZRX ..." />
              </Col>
            </Form.Group>
          </Form>
          <p className="mt-5">
            Please add specialized properties to the NFT (select one or
            multiple):{" "}
          </p>
          <div>
            <Form.Check className="ml-3" type={"checkbox"}>
              <Form.Check.Input type={"checkbox"} />
              <Form.Check.Label>{`Holder must hold specific quantity of tokens`}</Form.Check.Label>
            </Form.Check>
          </div>
          <div className="mt-4">
            <Form.Check className="ml-3" type={"checkbox"}>
              <Form.Check.Input type={"checkbox"} />
              <Form.Check.Label>{`NFT Auto Destructs on a timer`}</Form.Check.Label>
            </Form.Check>
          </div>
          <div className="mt-4">
            <Image src={forgeButton} className="forge-button" />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
