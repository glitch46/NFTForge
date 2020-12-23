const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const ForgeToken = artifacts.require("ForgeToken");
const ZutToken = artifacts.require("ZUT");

const ETH_FEE = web3.utils.toWei("0.02");
const ZUT_FEE = web3.utils.toWei("0.03");

const FEE_RECIPIENT = "0xD90981ee801ea9ccFDC4AEFFbD14a81989463c95";

module.exports = async function (deployer, network, accounts) {
  if (network === "development") return;

  // DEPLOY PROXY ZUT
  const zutToken = await deployProxy(ZutToken, ["Zero Utility Token", "ZUT"], {
    deployer,
  });

  console.log("Deployed ZUT", zutToken.address);

  // DEPLOY PROXY FORGE
  const forgeToken = await deployProxy(
    ForgeToken,
    [zutToken.address, FEE_RECIPIENT, ETH_FEE, ZUT_FEE],
    { deployer }
  );

  console.log("Deployed Forge", forgeToken.address);
};
