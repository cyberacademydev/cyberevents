const CyberCore = artifacts.require('CyberCore');
const CyberCoin = artifacts.require('CyberCoin');

contract('CyberCore', function([], accounts) {

  let token;

  beforeEach('set up contract for each test', async function() {
    token = await CyberCoin.new();
    core = await CyberCore.new(token.address);
  });
  
});
