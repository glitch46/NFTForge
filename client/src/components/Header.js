import React from "react";
import { Button } from "react-bootstrap";

export default function Header({ account, logout, connectWeb3 }) {
  return (
    <div className="float-right">
      {account ? (
        <>
          <h5 className="mr-3">
            Connected:{" "}
            {account.substring(0, 4) + "..." + account.substring(38, 42)}
          </h5>
          <div className="float-right">
            <Button
              className="mr-5"
              variant="outline-secondary"
              size="sm"
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="secondary"
          onClick={connectWeb3}
          className="connect-button mt-4 mr-5"
        >
          Connect to Web3
        </Button>
      )}
    </div>
  );
}
