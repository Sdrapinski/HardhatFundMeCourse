const { assert, expect } = require("chai");
//const {  } = require("@nomiclabs/hardhat-ethers");
const { deployments, getNamedAccounts, ethers } = require("hardhat");

describe("FundMe", async function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1");
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    // const accounts = await ethers.getSigners();
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await (
      await ethers.getContract("MockV3Aggregator", deployer)
    ).address;
  });
  describe("constructor", async function () {
    it("sets the agregator address correctly", async function () {
      const response = await fundMe.priceFeed();
      assert.equal(response, mockV3Aggregator);
    });
  });
  describe("fund", async function () {
    it("Fails if you dont send enaough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith("nie wyslano 1 ethera");
    });
    it("update the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.funders(0);
      assert.equal(funder, deployer);
    });
  });
  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });
    it("Withdraw ETH from a single founder", async function () {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingfundMebalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeplyerBalance = await fundMe.provider.getBalance(deployer);
      assert.equal(endingfundMebalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance),
        endingDeplyerBalance.add(gasCost).toString()
      );
    });
    it("allows us to withdraw with multiple funders", async function () {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingfundMebalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeplyerBalance = await fundMe.provider.getBalance(deployer);

      assert.equal(endingfundMebalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance),
        endingDeplyerBalance.add(gasCost).toString()
      );

      await expect(fundMe.funders(0)).to.be.reverted;

      for (let i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });
    it("Only allows the owner to withdraw", async function () {
      const accounts = ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(attackerConnectedContract.withdraw()).to.be.reverted;
    });

    it("cheaper withdraw", async function () {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.cheaperWithdrwa();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingfundMebalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeplyerBalance = await fundMe.provider.getBalance(deployer);

      assert.equal(endingfundMebalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance),
        endingDeplyerBalance.add(gasCost).toString()
      );

      await expect(fundMe.funders(0)).to.be.reverted;

      for (let i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });
  });
});
