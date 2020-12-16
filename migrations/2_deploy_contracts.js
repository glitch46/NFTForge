const ForgeToken = artifacts.require("ForgeToken");

module.exports = function(deployer) {
  deployer.deploy(ForgeToken);
};
