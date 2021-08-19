const K9WalletToken = artifacts.require("K9WalletToken");

module.exports = function (deployer) {
  deployer.deploy(K9WalletToken);
};
