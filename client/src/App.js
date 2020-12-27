import { useState, useCallback } from "react";
import { Button, Container, Row, Col, Image, Form } from "react-bootstrap";
import dayjs from "dayjs";
import ipfs from "./utils/ipfs";

// Web3
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";
import Authereum from "authereum";
import { erc20Abi, forgeAbi } from "./abis";
import { FORGE_ADDRESS, ZUT_ADDRESS, ZERO_ADDRESS } from "./constants";

// CSS
import "./App.css";

// Images
import image from "./assets/logo.png";
import forgeButton from "./assets/forgeButton.png";
import uploadButton from "./assets/uploadButton.png";

// Web3 Modal
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: "36bbdc3ed5bd449fad0374a2e07b850a", // required
    },
  },
  torus: {
    package: Torus, // required
    options: {
      networkParams: {
        host: "https://mainnet.infura.io/v3/36bbdc3ed5bd449fad0374a2e07b850a", // optional
        networkId: 1, // optional
      },
      config: {
        buildEnv: "production", // optional
      },
    },
  },
  authereum: {
    package: Authereum,
  },
};
const web3Modal = new Web3Modal({
  network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions, // required
  theme: "dark",
});

function App() {
  const [account, setAccount] = useState(null);

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

  // Expiration Condition
  const [isPaymentETH, setIsPaymentETH] = useState(true);

  // Web3
  const [forgeContract, setForgeContract] = useState(null);
  const [zutContract, setZutContract] = useState(null);

  // Functions

  const logout = () => {
    setAccount(null);
    web3Modal.clearCachedProvider();
  };

  const toWei = (num) => window.web3.utils.toWei(String(num));
  const fromWei = (num) => window.web3.utils.fromWei(String(num));

  const connectWeb3 = useCallback(async () => {
    try {
      const provider = await web3Modal.connect();

      provider.on("accountsChanged", (acc) => {
        setAccount(acc[0]);
      });

      window.web3 = new Web3(provider);

      const acc = await window.web3.eth.getAccounts();
      setAccount(acc[0]);

      window.zut = new window.web3.eth.Contract(erc20Abi, ZUT_ADDRESS);
      window.forge = new window.web3.eth.Contract(forgeAbi, FORGE_ADDRESS);

      setZutContract(window.zut);
      setForgeContract(window.forge);

      console.log("Connected Account: ", acc[0]);
    } catch (error) {
      console.log(error.message);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    console.log("Paying with ETH?", isPaymentETH);
    console.log("Creating NFT...");

    try {
      // const ipfsHash = await addToIpfs();
      // console.log(ipfsHash);

      const now = dayjs().unix();

      console.log("Current Time", now);

      const ethFee = await forgeContract.methods.ethFee().call();
      console.log("ETH FEE", fromWei(ethFee));

      await forgeContract.methods
        .buyWithETH(10, ZERO_ADDRESS, 0, now + 3600, "")
        .send({ from: account, value: 10 * ethFee });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
      <div className="float-right">
        {account ? (
          <>
            <h5 className="mr-5">
              Connected:{" "}
              {account.substring(0, 4) + "..." + account.substring(38, 42)}
              <span>
                <Button
                  className="ml-2"
                  variant="outline-secondary"
                  size="sm"
                  onClick={logout}
                >
                  Logout
                </Button>
              </span>
            </h5>
          </>
        ) : (
          <Button
            variant="secondary"
            onClick={connectWeb3}
            className="connect-button mr-5"
          >
            Connect to Web3
          </Button>
        )}
      </div>
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col>
            <Image src={image} className="logo" alt="NFT Forge Logo"></Image>
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
                    <Form.Control
                      type="text"
                      placeholder="Eg. Blue ZUT Statue"
                    />
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

            {/* Select Payment */}
            <div className="mt-4 ml-3">
              <Form.Group as={Row} controlId="formPlaintextPassword">
                <Form.Label as="legend" column sm="4">
                  Payment Type
                </Form.Label>
                <Col sm="8" className="align-self-center">
                  <Form.Check
                    type="radio"
                    label="ETH"
                    checked={isPaymentETH}
                    onChange={(e) => setIsPaymentETH(true)}
                  />
                  <Form.Check
                    type="radio"
                    label="ZUT"
                    checked={!isPaymentETH}
                    onChange={(e) => setIsPaymentETH(false)}
                  />
                </Col>
              </Form.Group>
            </div>

            {/* Token Creation */}
            {account && (
              <div className="mt-4">
                <Image
                  src={forgeButton}
                  alt="NFT Forge Button"
                  className="forge-button"
                  onClick={createToken}
                />
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
