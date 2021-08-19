const K9WalletTokenPreSale = artifacts.require("K9WalletTokenPreSale");

module.exports = function (deployer) {
  deployer.deploy(K9WalletTokenPreSale, '0xA6F47dF197F7e7993E268682670026BBe81E532c', '0xA6F47dF197F7e7993E268682670026BBe81E532c');
};
