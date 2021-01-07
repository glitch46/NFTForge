const ZUT = artifacts.require("ZUT");

//truffle exec scripts/mintZut.js 0x2DfC59f70826281BC2EE0bE2E4FAA59DE33e3622 100 --network rinkeby

module.exports = async (callback) => {
  try {
    const zut = await ZUT.at("0xc0171836BA0036AD0DD24697E22BF3d2d45B45aE");

    const address = process.argv[4];
    const amount = web3.utils.toWei(process.argv[5]);

    console.log(`Minting ${process.argv[5]} ZUT to ${address} `);
    await zut.mint(address, amount);
    const balance = await zut.balanceOf(address);
    console.log(
      `Done! New Balance: ${web3.utils.fromWei(String(balance))} ZUT`
    );

    callback();
  } catch (e) {
    callback(e);
  }
};
