// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/presets/ERC1155PresetMinterPauserUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "../utils/Strings.sol";

/**
 * @title Forge Token Protocol
 * @notice Mint NFTs with burnable conditions
 */

contract ForgeTokenV2 is ERC1155PresetMinterPauserUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    // === V1 State Vars START ===

    CountersUpgradeable.Counter private _tokenIdTracker;

    IERC20Upgradeable zut;

    uint256 public ethFee;
    uint256 public zutFee;

    address payable public feeRecipient;

    string private _contractURI;
    string private _baseURI;
    mapping(uint256 => string) public ipfsHashes;
    mapping(uint256 => address) tokenCreators;
    mapping(uint256 => bool) activated;

    // Storing conditions for burn
    mapping(uint256 => address) public tokenMinBalances;
    mapping(uint256 => uint256) public minBalances;
    mapping(uint256 => uint256) public expirations;

    // === V1 State Vars END ===

    // === V2 State Vars START ===

    // Add property 3
    mapping(uint256 => uint256) minHoldings;

    // === V2 State Vars END ===

    function initialize(
        IERC20Upgradeable _zut,
        address payable _feeRecipient,
        uint256 _ethFee,
        uint256 _zutFee
    ) public initializer {
        ERC1155PresetMinterPauserUpgradeable.initialize("");
        _baseURI = "https://ipfs.io/ipfs/";
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
        return Strings.strConcat(_baseURI, ipfsHashes[tokenId]);
    }

    function currentTokenId() public view returns (uint256) {
        return _tokenIdTracker.current();
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
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
        if (balanceOf(user, tokenId) == 0) return false;

        // Condition 1: Min Balance of ERC20
        if (tokenMinBalances[tokenId] != address(0)) {
            if (
                IERC20Upgradeable(tokenMinBalances[tokenId]).balanceOf(user) <
                minBalances[tokenId]
            ) return true;
        }

        // Condition 2: Expiration time
        if (
            expirations[tokenId] > 0 && block.timestamp > expirations[tokenId]
        ) {
            return true;
        }

        // Condition 3: Minimum Holdings
        if (
            minHoldings[tokenId] > 0 &&
            balanceOf(user, tokenId) < minHoldings[tokenId]
        ) {
            return true;
        }
    }

    /**
     *** SETTERS ****
     */

    function increaseTokenId() internal {
        _tokenIdTracker.increment();
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
        uint256 amountFee = ethFee.mul(amountTokens);

        require(msg.value >= amountFee, "Not enough ETH sent");
        require(expiration > block.timestamp, "Time in the past");
        require(tokenAddress != address(0), "ZERO ADDRESS");

        uint256 tokenId = _tokenIdTracker.current();

        // Add token properties and conditions
        ipfsHashes[tokenId] = ipfsHash;
        tokenMinBalances[tokenId] = tokenAddress;
        minBalances[tokenId] = minBalance;
        expirations[tokenId] = expiration;

        // Mint token to user
        _mint(_msgSender(), tokenId, amountTokens, "");

        increaseTokenId();

        // send ETH to fee recipient
        feeRecipient.transfer(amountFee);

        // Refund
        if (msg.value > amountFee) {
            _msgSender().transfer(msg.value.sub(amountFee));
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
        require(tokenAddress != address(0), "ZERO ADDRESS");

        uint256 amountFee = zutFee.mul(amountTokens);

        // Collect fees in ZUT token
        zut.safeTransferFrom(_msgSender(), feeRecipient, zutFee);

        uint256 tokenId = _tokenIdTracker.current();

        // Add token properties and conditions
        ipfsHashes[tokenId] = ipfsHash;
        tokenMinBalances[tokenId] = tokenAddress;
        minBalances[tokenId] = minBalance;
        expirations[tokenId] = expiration;

        // Mint token to user
        _mint(_msgSender(), tokenId, amountTokens, "");

        increaseTokenId();
    }

    /**
     * @notice Burn a NFT token if certain conditions are met
     */
    function burnToken(uint256 tokenId, address user) external {
        require(canBurn(tokenId, user), "Can't burn token yet");
        require(
            hasRole(keccak256("BURNER_ROLE"), _msgSender()),
            "Must have burner role"
        );

        _burn(user, tokenId, 1);
    }

    /**
     *** ADMIN ****
     */

    function setContractURI(string memory ipfsUrl) external onlyAdmin {
        _contractURI = ipfsUrl;
    }

    function setBaseURI(string memory baseURI) external onlyAdmin {
        _baseURI = baseURI;
    }

    function setETHFee(uint256 _ethFee) external onlyAdmin {
        ethFee = _ethFee;
    }

    function setZUTFee(uint256 _zutFee) external onlyAdmin {
        zutFee = _zutFee;
    }

    function setFeeRecipient(address payable _feeRecipient) external onlyAdmin {
        feeRecipient = _feeRecipient;
    }
}
