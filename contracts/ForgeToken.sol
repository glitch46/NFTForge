// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/presets/ERC1155PresetMinterPauser.sol";

contract ForgeToken is ERC1155PresetMinterPauser {
    constructor() public ERC1155PresetMinterPauser("ipfs.io/ipfs/") {}
}
