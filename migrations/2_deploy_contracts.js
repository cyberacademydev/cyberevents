const CyberCoin = artifacts.require("./CyberCoin.sol");

module.exports = function (deployer) {
  deployer.deploy(CyberCoin);
};
