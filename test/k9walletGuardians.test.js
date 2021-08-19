const K9WalletToken = artifacts.require('K9WalletToken');
const K9WalletGuardians = artifacts.require('K9WalletGuardians');
const truffleAssert = require('truffle-assertions');

contract('K9WalletGuardians', accounts => {

    const owner = accounts[0];
    const developer = accounts[1];
    const buyerAmount = '100000000';
    const buyerWithK9WT = accounts[2];
    const buyerWithETH = accounts[3];
    const buyerWithETH2 = accounts[4];

    let token;
    let nft;
    before(async () => {
        token = await K9WalletToken.deployed();
        nft = await K9WalletGuardians.new(token.address, developer);

        await token.transfer(buyerWithK9WT, web3.utils.toWei(buyerAmount)); 
        await token.transfer(buyerWithETH, web3.utils.toWei(buyerAmount)); 
    })

    it('Verify max tokens', async () => {
        const amount = await nft.numMaxGuardians();

        assert.equal(amount, 1000)
    })

    it('Check Users balances', async () => {
        const buyer1Balance = await token.balanceOf(buyerWithK9WT);
        assert.equal(buyer1Balance.toString(), web3.utils.toWei(buyerAmount))

        const buyer2Balance = await token.balanceOf(buyerWithETH);
        assert.equal(buyer2Balance.toString(), web3.utils.toWei(buyerAmount))
    })

    it('Verify Initial Tokens minted to developer', async () => {
        const devBalance = await nft.balanceOf(developer);
        assert.equal(devBalance, 10)

    })

    it("should reject non-owner from starting sale", async () => {
        await truffleAssert.reverts(nft.startSale({from: buyerWithK9WT }), "Ownable: caller is not the owner")
    });

    it("should reject transaction, sale not started", async () => {
        await truffleAssert.reverts(
            nft.buyWithETH(10, {
                from: buyerWithK9WT, 
                value: web3.utils.toWei('0.15') 
            }),
            "Sale hasn't started."
        )
    });

    it("should start sale and check", async () => {
        await nft.startSale();
    
        assert(nft.isSaleOpen(), true);
    });
    
    it("should purchase 10 tokens", async () => {
        await nft.buyWithETH(10, {
            from: buyerWithETH, 
            value: web3.utils.toWei('0.15') 
        });

        const nftBalance = await nft.balanceOf(buyerWithETH);

        assert.equal(nftBalance, 10);
    });


    it("should purchase with calculation", async () => {

        const desiredAmount = 23;

        const price = await nft.getETHPriceForTokens(desiredAmount, {
            from: buyerWithETH2
        });

        await nft.buyWithETH(desiredAmount, {
            from: buyerWithETH2, 
            value: price
        });

        const nftBalance = await nft.balanceOf(buyerWithETH2);

        assert.equal(nftBalance, desiredAmount);
    });

    it("should purchase 1 token", async () => {

        const initBalance = await nft.balanceOf(buyerWithETH2);

        const desiredAmount = 1;

        const price = await nft.getETHPriceForTokens(desiredAmount, {
            from: buyerWithETH2
        });

        await nft.buyWithETH(desiredAmount, {
            from: buyerWithETH2, 
            value: price
        });

        const nftBalance = await nft.balanceOf(buyerWithETH2);


        assert.equal(nftBalance, +initBalance + 1)
    });

    it('Should mint tokens to developer', async () => {
        await nft.mintToDeveloper(20, {
            from: developer,
        });

        const nftBalance = await nft.balanceOf(developer);

        assert.equal(nftBalance, 30);
    });

    it('Should have initial Allowance of 0', async () => {
        const allowance = await nft.K9WTApprovalAmount(buyerWithK9WT, {
            from: buyerWithK9WT
        });
        assert.equal(allowance, 0);
    });

    it('Should increase Allowange to desired purchase amount', async () => {
        const desiredTokens = 10;

        const k9wtCost = await nft.getK9WTPriceForTokens(desiredTokens, {
            from: buyerWithK9WT
        });

        await token.approve(nft.address, k9wtCost, {
            from: buyerWithK9WT
        });

        const allowance = await nft.K9WTApprovalAmount(buyerWithK9WT, {
            from: buyerWithK9WT
        });

        assert.equal(allowance.toString(), k9wtCost.toString());
    });

    it('Should purchase with K9WT', async () => {
        const desiredTokens = 10;

        await nft.buyWithK9WT(desiredTokens, {
            from: buyerWithK9WT
        });

        const nftBalance = await nft.balanceOf(buyerWithK9WT);

        assert.equal(nftBalance, desiredTokens);
    });


    it('Contract Should Contain K9WT', async () => {
        const previousPUrchased = 2000000;

        const tokenBalance = await token.balanceOf(nft.address);

        assert.equal(tokenBalance, previousPUrchased);
    });

    it('Should Burn K9WT', async () => {

        await nft.burnAvailableK9WT();

        const tokenBalance = await token.balanceOf(nft.address);

        assert.equal(tokenBalance, 0);
    });

    it('Should withdraw ETH to developer', async () => {
        const ethStartingBalance = await web3.eth.getBalance(developer);

        const contractBalance = await web3.eth.getBalance(nft.address);

        await nft.withdrawMoney(true)

        const ethEndingBalance = await web3.eth.getBalance(developer);

        const bn1 = web3.utils.toBN(ethStartingBalance)
        const bn2 = web3.utils.toBN(contractBalance)

        const combined = bn1.add(bn2)

        assert.equal(ethEndingBalance, combined)

    });

    // it("should buy more tokens and  widthdraw to owner", async () => {

    //     const desiredAmount = 23;

    //     const price = await nft.getETHPriceForTokens(desiredAmount, {
    //         from: buyerWithETH2
    //     });

    //     await nft.buyWithETH(desiredAmount, {
    //         from: buyerWithETH2, 
    //         value: price
    //     });

    //     const ethStartingBalance = await web3.eth.getBalance(owner);

    //     console.log(ethStartingBalance.toString());

    //     const contractBalance = await web3.eth.getBalance(nft.address);

    //     await nft.withdrawMoney(false)

    //     const ethEndingBalance = await web3.eth.getBalance(owner);

    //     console.log(ethEndingBalance.toString());

    //     const bn1 = web3.utils.toBN(ethStartingBalance)
    //     const bn2 = web3.utils.toBN(contractBalance)

    //     const combined = bn1.add(bn2)

    //     // assert.equal(ethEndingBalance, combined)
        
    // });


    it('buy up all tokens', async () => {
        
        while(true) {

            const purchased = await nft.totalSupply();

            if (purchased > 950) {

                break;
            }

            const price = await nft.getETHPriceForTokens(50, {
                from: buyerWithETH2
            });
    
            await nft.buyWithETH(50, {
                from: buyerWithETH2, 
                value: price
            });

        }

        const purchased = await nft.totalSupply();
        const toBuy = 1000 - purchased;

        const price = await nft.getETHPriceForTokens(toBuy, {
            from: buyerWithETH2
        });

        await nft.buyWithETH(toBuy, {
            from: buyerWithETH2, 
            value: price
        });

    });

    it("should reject with no Tokens available", async () => {

        await truffleAssert.reverts(nft.buyWithETH(1, {
            from: buyerWithETH2, 
            value: web3.utils.toWei('0.015') 
        }), "There aren't this many tokens left.");
    });

    it('set dark theme token uri, and verify', async () => {
        const uriDark = "https://dark.dank"
        await nft.setDarkThemeURI(uriDark)

        const uri1 = await nft.tokenURI(1)
        const uri2 = await nft.tokenURI(100)

        assert.equal(uri1, uriDark)
        assert.equal(uri2, uriDark)
    });

    it('set regular theme token uri, and veridy', async () => {
        const uriReg = "https://cool.com"

        await nft.setBaseURI(uriReg);

        const uri1 = await nft.tokenURI(101)
        const uri2 = await nft.tokenURI(150)
        const uri3 = await nft.tokenURI(501)

        assert.equal(uri1, uriReg)
        assert.equal(uri2, uriReg)
        assert.equal(uri3, uriReg)
    });

    
});