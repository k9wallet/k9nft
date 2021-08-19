const K9WalletToken = artifacts.require('K9WalletToken');
const K9WalletGuardians = artifacts.require('K9WalletGuardians');
const truffleAssert = require('truffle-assertions');

contract('K9WalletGuardians', accounts => {

    let token;
    let nft;
    before(async () => {
        token = await K9WalletToken.deployed();
        nft = await K9WalletGuardians.new(accounts[0], token.address);
    })

});