// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract ForgeToken is ERC721PresetMinterPauserAutoId {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 ethFee;
    uint256 zutFee;

    IERC20 public zut;

    struct Properties {
        address tokenToCheck;
        uint256 minBalance;
        uint256 expiration;
        bytes32 ipfsHash; // file
    }

    mapping(uint256 => Properties) tokenProperties;

    constructor(
        IERC20 _zut,
        uint256 _ethFee,
        uint256 _zutFee
    )
        public
        ERC721PresetMinterPauserAutoId("Forge Token", "FT", "ipfs.io/ipfs/")
    {
        zut = _zut;
        ethFee = _ethFee;
        zutFee = _zutFee;
    }

    function canBurn(uint256 tokenId) public view returns (bool burnable) {
        Properties memory _prop = tokenProperties[tokenId];

        if (_prop.tokenToCheck != address(0)) {
            burnable =
                IERC20(_prop.tokenToCheck).balanceOf(ownerOf(tokenId)) <
                _prop.minBalance;
        }

        if (_prop.expiration > 0) burnable = block.timestamp > _prop.expiration;
    }

    function buyWithETH(
        address tokenAddress,
        uint256 minBalance,
        uint256 expiration,
        bytes32 ipfsHash
    ) external payable {
        require(msg.value >= ethFee, "Not enough ETH sent");
        require(expiration > block.timestamp, "Time in the past");

        // Add burnable conditions to token
        tokenProperties[currentTokenId()] = Properties(
            tokenAddress,
            minBalance,
            expiration,
            ipfsHash
        );

        // Mint token to user
        mint(msg.sender);

        // Refund
        if (msg.value > ethFee) {
            msg.sender.transfer(msg.value.sub(ethFee));
        }
    }

    function buyWithZUT(
        address tokenAddress,
        uint256 minBalance,
        uint256 expiration,
        bytes32 ipfsHash
    ) external {
        require(expiration > block.timestamp, "Time in the past");

        // Collect ZUT tokens
        zut.safeTransferFrom(msg.sender, address(this), zutFee);

        // Token Properties
        tokenProperties[currentTokenId()] = Properties(
            tokenAddress,
            minBalance,
            expiration,
            ipfsHash
        );

        // Mint token to user
        mint(msg.sender);
    }
}
