// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Forge Token Protocol
 * @notice Mint NFTs with burnable conditions
 */
contract ForgeToken is ERC721, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    uint256 ethFee;
    uint256 zutFee;

    IERC20 public zut;

    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Counters.Counter private _tokenIdTracker;

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
    ) ERC721("Forge Token", "FT") {
        _setBaseURI("ipfs.io/ipfs/");
        _setupRole(BURNER_ROLE, _msgSender());
        zut = _zut;
        ethFee = _ethFee;
        zutFee = _zutFee;
    }

    /**
     * @dev Determine if a token can be burned, 
        checking token balances and expiration time
     */
    function canBurn(uint256 tokenId) public view returns (bool burnable) {
        Properties memory _prop = tokenProperties[tokenId];

        if (_prop.tokenToCheck != address(0)) {
            burnable =
                IERC20(_prop.tokenToCheck).balanceOf(ownerOf(tokenId)) <
                _prop.minBalance;
        }

        if (_prop.expiration > 0) burnable = block.timestamp > _prop.expiration;
    }

    function mint(address to) internal {
        _mint(to, _tokenIdTracker.current());
        _tokenIdTracker.increment();
    }

    /**
     * @dev Buy NFT using ETH
     */
    function buyWithETH(
        address tokenAddress,
        uint256 minBalance,
        uint256 expiration,
        bytes32 ipfsHash
    ) external payable {
        require(msg.value >= ethFee, "Not enough ETH sent");
        require(expiration > block.timestamp, "Time in the past");

        // Add burnable conditions to token
        tokenProperties[_tokenIdTracker.current()] = Properties(
            tokenAddress,
            minBalance,
            expiration,
            ipfsHash
        );

        // Mint token to user
        mint(_msgSender());

        // Refund
        if (msg.value > ethFee) {
            _msgSender().transfer(msg.value.sub(ethFee));
        }
    }

    /**
     * @dev Buy NFT using ZUT
     */
    function buyWithZUT(
        address tokenAddress,
        uint256 minBalance,
        uint256 expiration,
        bytes32 ipfsHash
    ) external {
        require(expiration > block.timestamp, "Time in the past");

        // Collect ZUT tokens
        zut.safeTransferFrom(_msgSender(), address(this), zutFee);

        // Token Properties
        tokenProperties[_tokenIdTracker.current()] = Properties(
            tokenAddress,
            minBalance,
            expiration,
            ipfsHash
        );

        // Mint token to user
        mint(_msgSender());
    }

    /**
     * @dev Burn a NFT token
     */
    function burnToken(uint256 tokenId) external {
        require(canBurn(tokenId), "Can't burn token yet");
        require(hasRole(BURNER_ROLE, _msgSender()), "Must have burner role");

        _burn(tokenId);
    }
}
