const K9WalletToken = artifacts.require("K9WalletToken");
const K9WalletGuardians = artifacts.require('K9WalletGuardians');

module.exports = async (deployer) => {
  let token = await deployer.deploy(K9WalletToken);
  deployer.deploy(K9WalletGuardians, K9WalletToken.address, deployer.address)
};
