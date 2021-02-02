const {
  upgradeProxy,
  silenceWarnings,
} = require("@openzeppelin/truffle-upgrades");

const ForgeToken = artifacts.require("ForgeToken");
const ForgeTokenV2 = artifacts.require("ForgeTokenV2");

module.exports = async function (deployer, network, accounts) {
  // if (network === "test") return;
  // silenceWarnings();
  // console.log("\nUpgrading Proxy...");
  // const forge = await ForgeToken.deployed();
  // const instance = await upgradeProxy(forge.address, ForgeTokenV2, {
  //   deployer,
  //   unsafeAllowCustomTypes: true,
  // });
  // console.log("Upgraded!", instance.address);
};
