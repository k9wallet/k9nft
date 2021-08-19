// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract K9WalletGuardians is Ownable, ERC721Enumerable, ReentrancyGuard {
    using Counters for Counters.Counter;

    constructor(IERC20 _token, address _dev)
        ERC721("K9 Wallet Guardians", "K9WG")
    {
        _developer = _dev;
        _k9WalletToken = _token;
        // Set initial Rate to 200,000 K9WT
        _K9WTRate = 200000;
    }

    uint256 public constant MINT_LIMIT = 50;
    uint256 private _numAvailableTokens = 10000;
    // 0.015 ETH per token
    uint256 private immutable _ethRate = 0.015 ether;
    // max Guardians available
    uint256 private _maxGuardians = 10000;
    Counters.Counter private _tokenIdTracker;
    IERC20 private _k9WalletToken;
    // K9Wallet Tokens per Guardian
    uint256 private _K9WTRate;
    bool public isSaleOn = false;
    address private immutable _developer;
    // contract metadata URI for opensea
    string public contractURI;

    bool public limitedDarkThemeTokensEnabled = false;
    // Only Tokens with id 1 - 100 are Dark Theme enabled
    uint256 public immutable darkThemeTokensLastID = 100;

    function buyWithETH(uint256 _numToMint) public payable nonReentrant {
        require(isSaleOn, "Sale hasn't started.");
        uint256 totalSupply = totalSupply();
        require(
            totalSupply + _numToMint <= numMaxGuardians(),
            "There aren't this many tokens left."
        );
        uint256 costForMintingTokens = getETHPriceForTokens(_numToMint);
        require(
            msg.value >= costForMintingTokens,
            "Too little sent, please send more eth."
        );
        if (msg.value > costForMintingTokens) {
            payable(msg.sender).transfer(msg.value - costForMintingTokens);
        }

        _mint(_numToMint);
    }

    function buyWithK9WT(uint256 _numToMint) public nonReentrant {
        require(isSaleOn, "Sale hasn't started.");
        uint256 totalSupply = totalSupply();
        require(
            totalSupply + _numToMint <= numMaxGuardians(),
            "There aren't this many tokens left."
        );
        uint256 costForMintingTokens = getK9WTPriceForTokens(_numToMint);

        require(
            _k9WalletToken.allowance(msg.sender, address(this)) >=
                costForMintingTokens,
            "Approve K9WT for spending"
        );

        SafeERC20.safeTransferFrom(
            _k9WalletToken,
            msg.sender,
            address(this),
            costForMintingTokens
        );

        _mint(_numToMint);
    }

    function approveK9WTForPurchasing(uint256 _numToPurchase) external {
        uint256 costForMintingTokens = getK9WTPriceForTokens(_numToPurchase);
        _k9WalletToken.approve(address(this), costForMintingTokens);
    }

    function K9WTApprovalAmount(address buyer) external view returns (uint256) {
        return _k9WalletToken.allowance(buyer, address(this));
    }

    // internal minting function
    function _mint(uint256 _numToMint) internal {
        require(_numToMint <= MINT_LIMIT, "Minting Limit Reached");

        uint256 updatedNumAvailableTokens = _numAvailableTokens;
        for (uint256 i = 0; i < _numToMint; i++) {
            uint256 newTokenId = _tokenIdTracker.current();
            _safeMint(msg.sender, newTokenId);
            _tokenIdTracker.increment();
            updatedNumAvailableTokens--;
        }
        _numAvailableTokens = updatedNumAvailableTokens;
    }

    function getETHPriceForTokens(uint256 _numToMint)
        public
        view
        returns (uint256)
    {
        require(
            totalSupply() + _numToMint <= numMaxGuardians(),
            "There aren't this many tokens left."
        );

        return _numToMint * _ethRate;
    }

    function getK9WTPriceForTokens(uint256 _numToMint)
        public
        view
        returns (uint256)
    {
        require(
            totalSupply() + _numToMint <= numMaxGuardians(),
            "There aren't this many tokens left."
        );

        return _numToMint * _K9WTRate;
    }

    function numMaxGuardians() public view virtual returns (uint256) {
        return _maxGuardians;
    }

    function currencK9WTRate() public view virtual returns (uint256) {
        return _K9WTRate;
    }

    /*
     * Dev stuff
     */

    // metadata URI
    string private _baseTokenURI;
    string private _darkThemeURI;

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function setDarkThemeURI(string memory darkURI) external onlyOwner {
        _darkThemeURI = darkURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (
            limitedDarkThemeTokensEnabled && _tokenId <= darkThemeTokensLastID
        ) {
            if (bytes(_darkThemeURI).length == 0) {
                string memory _darkTokenURI = Strings.toString(_tokenId);
                return _darkTokenURI;
            }

            return _darkThemeURI;
        }
        string memory base = _baseURI();
        

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            string memory _tokenURI = Strings.toString(_tokenId);
            return _tokenURI;
        }

        return base;
    }

    function startSale() public onlyOwner {
        isSaleOn = true;
    }

    function endSale() public onlyOwner {
        isSaleOn = false;
    }

    // Given the fluctuating price of K9WT, the rate may need to be updated
    function setK9WalletTokenRate(uint256 _newRate) public onlyOwner {
        _K9WTRate = _newRate;
    }

    function burnAvailableK9WT() public {
        uint256 amount = _k9WalletToken.balanceOf(address(this));
        SafeERC20.safeTransfer(
            _k9WalletToken,
            0x000000000000000000000000000000000000dEaD,
            amount
        );
    }

    function setContractURI(string memory _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    // withdraw ERC20 tokens
    function withdrawAnyERC20(IERC20 token) external onlyOwner {
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to withdraw");
        token.transfer(_developer, amount);
    }

    function withdrawMoney(bool toDeveloper) public payable onlyOwner {
        if (toDeveloper) {
            (bool success, ) = _developer.call{value: address(this).balance}(
                ""
            );
            require(success, "Transfer failed.");
        } else {
            (bool success, ) = msg.sender.call{value: address(this).balance}(
                ""
            );
            require(success, "Transfer failed.");
        }
    }
}
