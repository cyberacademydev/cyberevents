const CyberCoin = artifacts.require('CyberCoin');

contract('CyberCoin', function([minter]) {

  let cyber;

  beforeEach('set up contract for each test', async function() {
    cyber = await CyberCoin.new();
  });

  it('test initial tokens amount', async function() {
    const expected = 0;
    assert.equal(await cyber.totalSupply(), expected);
  });

  it('test minter address', async function () {
    await cyber.setMinter(minter);
    assert.equal(await cyber.minter(), minter);
  });

});
