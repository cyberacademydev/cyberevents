const CyberCoin = artifacts.require('CyberCoin');
const CyberCore = artifacts.require('CyberCore');

module.exports = function (deployer, network, accounts) {
  deployer.deploy(CyberCoin).then(function() {
    return deployer.deploy(CyberCore, CyberCoin.address)
  });
};
