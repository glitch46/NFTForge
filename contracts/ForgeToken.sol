// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/presets/ERC1155PresetMinterPauser.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Forge Token Protocol
 * @notice Mint NFTs with burnable conditions
 */
contract ForgeToken is ERC1155PresetMinterPauser {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;

    // ETH and ZUT fees per token minted
    uint256 ethFee;
    uint256 zutFee;

    address payable public feeRecipient;

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
        address payable _feeRecipient,
        uint256 _ethFee,
        uint256 _zutFee
    ) ERC1155PresetMinterPauser("ipfs.io/ipfs/") {
        zut = _zut;
        feeRecipient = _feeRecipient;
        ethFee = _ethFee;
        zutFee = _zutFee;
    }

    /**
     *** GETTERS ****
     */

    /**
     * @dev Determine if a token can be burned, 
        checking token balances and expiration time
     */
    function canBurn(uint256 tokenId, address user)
        public
        view
        returns (bool burnable)
    {
        Properties memory _prop = tokenProperties[tokenId];

        if (_prop.tokenToCheck != address(0)) {
            burnable =
                IERC20(_prop.tokenToCheck).balanceOf(user) < _prop.minBalance;
        }

        if (_prop.expiration > 0) burnable = block.timestamp > _prop.expiration;
    }

    function currentTokenId() public view returns (uint256) {
        return _tokenIdTracker.current();
    }

    /**
     *** SETTERS ****
     */

    function addBurnRole(address allowedAddress) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "ERC1155PresetMinterPauser: must have admin role to mint"
        );
        _setupRole(BURNER_ROLE, allowedAddress);
    }

    /**
     * @dev Buy NFT using ETH
     */
    function buyWithETH(
        uint256 amountTokens,
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
        mint(_msgSender(), _tokenIdTracker.current(), amountTokens, "");

        _tokenIdTracker.increment();

        // send ETH to fee recipient
        feeRecipient.transfer(ethFee);

        // Refund
        if (msg.value > ethFee) {
            _msgSender().transfer(msg.value.sub(ethFee));
        }
    }

    /**
     * @dev Buy NFT using ZUT
     */
    function buyWithZUT(
        uint256 amountTokens,
        address tokenAddress,
        uint256 minBalance,
        uint256 expiration,
        bytes32 ipfsHash
    ) external {
        require(expiration > block.timestamp, "Time in the past");

        // Collect fees in ZUT token
        zut.safeTransferFrom(_msgSender(), feeRecipient, zutFee);

        // Token Properties
        tokenProperties[_tokenIdTracker.current()] = Properties(
            tokenAddress,
            minBalance,
            expiration,
            ipfsHash
        );

        // Mint token to user
        mint(_msgSender(), _tokenIdTracker.current(), amountTokens, "");

        _tokenIdTracker.increment();
    }

    /**
     * @dev Burn a NFT token
     */
    function burnToken(uint256 tokenId, address user) external {
        require(canBurn(tokenId, user), "Can't burn token yet");
        require(hasRole(BURNER_ROLE, _msgSender()), "Must have burner role");

        _burn(user, tokenId, 1);
    }
}
