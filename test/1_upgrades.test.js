const {
  deployProxy,
  upgradeProxy,
  silenceWarnings,
} = require("@openzeppelin/truffle-upgrades");

const {
  getImplementationAddress,
  getAdminAddress,
} = require("@openzeppelin/upgrades-core");

const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time,
} = require("@openzeppelin/test-helpers");

const ForgeToken = artifacts.require("ForgeToken");
const ForgeTokenV2 = artifacts.require("ForgeTokenV2");
const ZUT = artifacts.require("ZUT");

const ETH_FEE = web3.utils.toWei("0.02");
const ZUT_FEE = web3.utils.toWei("0.03");

const IPFS_HASH1 = "Qmbd1guB9bi3hKEYGGvQJYNvDUpCeuW3y4J7ydJtHfYMF6";
const IPFS_HASH2 = "QmTo5Vo3q2xF7Q4vCqkEN3iEuowVyo8rJtBXXQJw5rnXMB";

contract("Upgradeability", ([admin, alice, bob, feeRecipient]) => {
  let zut, forge;

  silenceWarnings();

  describe("Deployment", function () {
    it("should be able to deploy ZUT proxy ERC20", async function () {
      zut = await deployProxy(ZUT, ["Zero Utility Token", "ZUT"], {
        admin,
        unsafeAllowCustomTypes: true,
      });
    });

    it("should be able to deploy Forge proxy ERC1155", async function () {
      forge = await deployProxy(
        ForgeToken,
        [zut.address, feeRecipient, ETH_FEE, ZUT_FEE],
        { admin, unsafeAllowCustomTypes: true }
      );
    });
  });

  describe("Initial Values", function () {
    it("should return correct ETH fee", async function () {
      const ethFee = await forge.ethFee();
      assert.equal(ethFee, ETH_FEE);
    });

    it("should return correct ZUT fee", async function () {
      const zutFee = await forge.zutFee();
      assert.equal(zutFee, ZUT_FEE);
    });
  });

  describe("Upgrade", function () {
    it("should upgrade contract to V2 by admin", async function () {
      forge = await upgradeProxy(forge.address, ForgeTokenV2, {
        admin,
        unsafeAllowCustomTypes: true,
      });
    });

    it("should return correct ETH fee after upgrade", async function () {
      const ethFee = await forge.ethFee();
      assert.equal(ethFee, ETH_FEE);
    });

    it("should return correct ZUT fee after upgrade", async function () {
      const zutFee = await forge.zutFee();
      assert.equal(zutFee, ZUT_FEE);
    });
  });
});
