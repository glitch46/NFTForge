// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/presets/ERC1155PresetMinterPauser.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./utils/Strings.sol";

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

    string private _contractURI;
    string private _baseURI;

    struct Properties {
        address tokenToCheck;
        uint256 minBalance;
        uint256 expiration;
        string ipfsHash; // file
    }

    mapping(uint256 => Properties) tokenProperties;

    constructor(
        IERC20 _zut,
        address payable _feeRecipient,
        uint256 _ethFee,
        uint256 _zutFee
    ) ERC1155PresetMinterPauser("") {
        _baseURI = "ipfs://";
        zut = _zut;
        feeRecipient = _feeRecipient;
        ethFee = _ethFee;
        zutFee = _zutFee;
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "ERC1155PresetMinterPauser: must have admin role to mint"
        );
        _;
    }

    /**
     *** GETTERS ****
     */

    /**
     * @dev concatenate base uri and ipfs hash of token
     */
    function uri(uint256 tokenId)
        external
        view
        override
        returns (string memory)
    {
        return Strings.strConcat(_baseURI, tokenProperties[tokenId].ipfsHash);
    }

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

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    /**
     *** SETTERS ****
     */

    function setContractURI(string memory ipfsUrl) external onlyAdmin {
        _contractURI = ipfsUrl;
    }

    function addBurnRole(address allowedAddress) external onlyAdmin {
        _setupRole(BURNER_ROLE, allowedAddress);
    }

    /**
     * @notice Create NFT Collecions paying with ETH
     */
    function buyWithETH(
        uint256 amountTokens,
        address tokenAddress,
        uint256 minBalance,
        uint256 expiration,
        string memory ipfsHash
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
     * @notice Create NFT Collecions paying with ZUT
     */
    function buyWithZUT(
        uint256 amountTokens,
        address tokenAddress,
        uint256 minBalance,
        uint256 expiration,
        string memory ipfsHash
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
     * @notice Burn a NFT token if certain conditions are met
     */
    function burnToken(uint256 tokenId, address user) external {
        require(canBurn(tokenId, user), "Can't burn token yet");
        require(hasRole(BURNER_ROLE, _msgSender()), "Must have burner role");

        _burn(user, tokenId, 1);
    }
}
