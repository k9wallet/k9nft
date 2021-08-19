const K9WalletToken = artifacts.require("K9WalletToken");
const K9WalletGuardians = artifacts.require('K9WalletGuardians');

module.exports = async (deployer) => {
  await deployer.deploy(K9WalletToken);
  deployer.deploy(K9WalletGuardians, '0xA6F47dF197F7e7993E268682670026BBe81E532c', '0xA6F47dF197F7e7993E268682670026BBe81E532c')
};
