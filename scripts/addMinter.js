const ForgeToken = artifacts.require("ForgeToken");

//truffle exec scripts/addMinter.js 0xd750bCe912F6074178D68B6014bc003764201803 --network rinkeby
module.exports = async (callback) => {
  try {
    const forgeToken = await ForgeToken.at(
      "0xC9844e4264C9785012A4a0f5ee8eE7F789D2D7B7"
    );

    const address = process.argv[4];

    console.log(`Adding ${address} as burner role`);
    await forgeToken.grantRole(web3.utils.sha3("BURNER_ROLE"), address);
    const hasRole = await forgeToken.hasRole(
      web3.utils.sha3("BURNER_ROLE"),
      address
    );
    console.log(`Success? ${hasRole}`);

    callback();
  } catch (e) {
    callback(e);
  }
};
