const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const ForgeToken = artifacts.require("ForgeToken");
const ZUT = artifacts.require("ZUT");

const ETH_FEE = web3.utils.toWei("0.02");
const ZUT_FEE = web3.utils.toWei("0.03");

const FEE_RECIPIENT = "0xD90981ee801ea9ccFDC4AEFFbD14a81989463c95";

const APP_URL = "https://nft-forge.netlify.app/";

module.exports = async function (deployer, network, accounts) {
  if (network === "test") return;

  // DEPLOY PROXY ZUT ERC20
  const zutToken = await deployProxy(ZUT, ["Zero Utility Token", "ZUT"], {
    deployer,
    unsafeAllowCustomTypes: true,
  });

  console.log("Deployed ZUT", zutToken.address);

  // DEPLOY PROXY FORGE ERC1155
  const forgeToken = await deployProxy(
    ForgeToken,
    [zutToken.address, FEE_RECIPIENT, ETH_FEE, ZUT_FEE],
    { deployer, unsafeAllowCustomTypes: true }
  );

  await forgeToken.setContractURI(APP_URL);

  console.log("Deployed Forge", forgeToken.address);
};
