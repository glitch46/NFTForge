const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const ForgeToken = artifacts.require("ForgeToken");
const ZutToken = artifacts.require("ZUTMock");
const Triggerer = artifacts.require("Triggerer");

const ETH_FEE = web3.utils.toWei("0.02");
const ZUT_FEE = web3.utils.toWei("0.03");

const FEE_RECIPIENT = "0xD90981ee801ea9ccFDC4AEFFbD14a81989463c95";

module.exports = async function (deployer, network, accounts) {
  if (network === "development") return;

  await deployer.deploy(ZutToken);
  await deployer.deploy(
    ForgeToken,
    ZutToken.address,
    FEE_RECIPIENT,
    ETH_FEE,
    ZUT_FEE
  );

  // DEPLOY PROXY
  const instance = await deployProxy(
    Triggerer,
    [ForgeToken.address, ZutToken.address, FEE_RECIPIENT, ETH_FEE, ZUT_FEE],
    { deployer }
  );

  console.log("Deployed", instance.address);
};
