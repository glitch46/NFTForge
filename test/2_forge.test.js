const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const {
  // BN, // Big Number support
  // constants, // Common constants, like the zero address and largest integers
  // expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time,
} = require("@openzeppelin/test-helpers");

const ForgeToken = artifacts.require("ForgeToken");
const ZUT = artifacts.require("ZUT");

const ETH_FEE = web3.utils.toWei("0.02");
const ZUT_FEE = web3.utils.toWei("0.01");

const IPFS_HASH1 = "Qmbd1guB9bi3hKEYGGvQJYNvDUpCeuW3y4J7ydJtHfYMF6";
const IPFS_HASH2 = "QmTo5Vo3q2xF7Q4vCqkEN3iEuowVyo8rJtBXXQJw5rnXMB";

contract("Forge Token", ([admin, alice, bob, feeRecipient]) => {
  let zut, forge;

  before(async function () {
    zut = await deployProxy(ZUT, ["Zero Utility Token", "ZUT"], {
      admin,
      unsafeAllowCustomTypes: true,
    });

    // DEPLOY PROXY FORGE ERC1155
    forge = await deployProxy(
      ForgeToken,
      [zut.address, feeRecipient, ETH_FEE, ZUT_FEE],
      { admin, unsafeAllowCustomTypes: true }
    );

    // Fund users with ZUT tokens
    await zut.mint(alice, web3.utils.toWei("1000"));
    await zut.mint(bob, web3.utils.toWei("1000"));
  });

  describe("Buying Tokens", function () {
    it("reverts when buying a token without sending ETH", async function () {
      const currentTime = await time.latest();

      await expectRevert(
        forge.buyWithETH(50, zut.address, 2, currentTime + 10, IPFS_HASH1, {
          from: alice,
        }),
        "Not enough ETH sent"
      );
    });

    it("should buy 50 tokens using ETH", async function () {
      const currentTime = await time.latest();

      await forge.buyWithETH(50, zut.address, 2, currentTime + 10, IPFS_HASH1, {
        from: alice,
        value: 50 * ETH_FEE,
      });

      const aliceBalance = await forge.balanceOf(alice, 0);
      assert.equal(aliceBalance, 50);
    });

    it("reverts when buying a token without using ZUT without approving first", async function () {
      const currentTime = await time.latest();

      await expectRevert(
        forge.buyWithZUT(50, zut.address, 2, currentTime + 10, IPFS_HASH1, {
          from: bob,
        }),
        "ERC20: transfer amount exceeds allowance"
      );
    });

    it("should buy a token using ZUT", async function () {
      const currentTime = await time.latest();

      await zut.approve(forge.address, String(50 * ZUT_FEE), { from: bob });

      await forge.buyWithZUT(50, zut.address, 2, currentTime + 10, IPFS_HASH1, {
        from: bob,
      });

      const bobBalance = await forge.balanceOf(bob, 1);
      assert.equal(bobBalance, 50);
    });
  });
});
