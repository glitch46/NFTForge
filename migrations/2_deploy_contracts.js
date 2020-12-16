const ForgeToken = artifacts.require("ForgeToken");
const ZutToken = artifacts.require("ZUTMock");

const ETH_FEE = 0.1;
const ZUT_FEE = 0.03;

module.exports = async function(deployer) {
  await deployer.deploy(ZutToken);

  await deployer.deploy(ForgeToken, ZutToken.address, web3.utils.toWei(String(ETH_FEE)), web3.utils.toWei(String(ZUT_FEE)));
};
