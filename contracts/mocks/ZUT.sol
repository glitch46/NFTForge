// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/presets/ERC20PresetMinterPauserUpgradeable.sol";

contract ZUT is ERC20PresetMinterPauserUpgradeable {
    function initialize(string memory name, string memory symbol)
        public
        override
        initializer
    {
        ERC20PresetMinterPauserUpgradeable.__ERC20PresetMinterPauser_init(
            name,
            symbol
        );
    }
}
