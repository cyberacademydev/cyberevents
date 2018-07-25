const CyberCoin = artifacts.require("./CyberCoin.sol");
const CyberCore = artifacts.require("./CyberCore.sol");

module.exports = function (deployer) {
  deployer.deploy(CyberCoin);
  deployer.deploy(CyberCore, CyberCoin.address);
};
