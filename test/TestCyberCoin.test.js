require('babel-register');

const CyberCoin = artifacts.require('CyberCoin');

contract('CyberCoin', function(accounts) {

  web3.eth.defaultAccount = accounts[0];
  let cyber;

  beforeEach('set up contract for each test', async function() {
    cyber = await CyberCoin.new();
  });

  describe('initial', function() {

    it('test initial tokens amount', async function () {
      const expected = 0;
      assert.equal(parseNumber(await cyber.totalSupply()), expected);
    });

    describe('ERC-165', function() {

      const INTERFACEID_ERC165 = '0x01ffc9a7';
      const INTERFACEID_ERC721 = '0x80ac58cd';
      const INTERFACEID_ERC721_EXISTS = '0x4f558e79';
      const INTERFACEID_ERC721_ENUMERABLE = '0x780e9d63';
      const INTERFACEID_ERC721_METADATA = '0x5b5e139f';
      const INTERFACEID_ERC721_TOKENSOF = '0x5a3f2672';

      it('registered the ERC165 interface', async function() {
        assert.equal(parseString(await cyber.supportsInterface(INTERFACEID_ERC165)), 'true');
      });

      it('registered the ERC721 interface', async function () {
        assert.equal(parseString(await cyber.supportsInterface(INTERFACEID_ERC721)), 'true');
      });

      it('registered the ERC721Exists interface', async function () {
        assert.equal(parseString(await cyber.supportsInterface(INTERFACEID_ERC721_EXISTS)), 'true');
      });

      it('registered the ERC721Enumerable interface', async function () {
        assert.equal(parseString(await cyber.supportsInterface(INTERFACEID_ERC721_ENUMERABLE)), 'true');
      });

      it('registered the ERC721Metadata interface', async function () {
        assert.equal(parseString(await cyber.supportsInterface(INTERFACEID_ERC721_METADATA)), 'true');
      });

      it('registered the ERC721TokensOf interface', async function () {
        assert.equal(parseString(await cyber.supportsInterface(INTERFACEID_ERC721_TOKENSOF)), 'true');
      });

    });

  });

  describe('mint', function() {

    const minter = accounts[0];
    const to = accounts[1];
    const tokenId = 1;
    const eventId = 1;
    let mintLogs = null;

    beforeEach('mint a new token', async function() {
      await cyber.setMinter(minter);
      const resultMint = await cyber.mint(to, eventId);
      mintLogs = resultMint.logs;
    });

    describe('when successful', function() {

      it('sets the minter to the given address', async function () {
        assert.equal(parseString(await cyber.minter()), minter);
      });

      it('increases total tokens supply', async function () {
        assert.equal(parseNumber(await cyber.totalSupply()), 1);
      });

      it('increases the balance of its owner', async function() {
        assert.equal(parseNumber(await cyber.balanceOf(to)), 1);
      });

      it('assigns the token to the new owner', async function() {
        assert.equal(parseString(await cyber.ownerOf(tokenId)), to);
      });

      it('assigns the token to the given event ID', async function() {
        assert.equal(parseNumber(await cyber.eventId(tokenId)), eventId);
      });

      it('adds the token to the list of the owned tokens', async function() {
        assert.equal(parseJSON(await cyber.tokensOf(to)), '["1"]');
      });

      it('emits a Mint event', async function() {
        assert.equal(mintLogs.length, 1);
        assert.equal(mintLogs[0].event, 'Mint');
        assert.equal(mintLogs[0].args.to, to);
        assert.equal(mintLogs[0].args.tokenId.toNumber(), 1);
      });

    });

  });
  
});


function parseNumber(bignumber) {
  return bignumber.toNumber();
}

function parseString(bignumber) {
  return bignumber.toString();
}

function parseJSON(bignumber) {
  return JSON.stringify(bignumber);
}
function parseObject(bignumber) {
  return JSON.parse(parseJSON(bignumber));
}
