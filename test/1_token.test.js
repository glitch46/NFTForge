const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
	expectRevert, // Assertions for transactions that should fail
	time
} = require('@openzeppelin/test-helpers');

const ForgeToken = artifacts.require("ForgeToken");
const ZutToken = artifacts.require("ZUTMock");

const ETH_FEE = web3.utils.toWei("0.1");
const ZUT_FEE = web3.utils.toWei("0.03");

const IPFS_HASH1 = web3.utils.sha3('hash1');
const IPFS_HASH2 = web3.utils.sha3('hash2');

contract('ERC20', ([admin, alice, bob])=> {
  let zut, forge;

  before(async function () {
    zut = await ZutToken.new();
    forge = await ForgeToken.new(zut.address, ETH_FEE, ZUT_FEE);
  });

  it('reverts when buying a token without sending ETH', async function () {
    const currentTime = await time.latest()
    // Conditions that trigger a require statement can be precisely tested
    await expectRevert(
        forge.buyWithETH(constants.ZERO_ADDRESS, 0, currentTime+1, IPFS_HASH1, { from: alice }),
        'Not enough ETH sent',
    );
  });  
});