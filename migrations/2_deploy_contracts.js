const CyberCoin = artifacts.require("./CyberCoin.sol");
const CyberCore = artifacts.require("./CyberCore.sol");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(CyberCoin).then(function() {
    return deployer.deploy(CyberCore, CyberCoin.address)
  });
};
