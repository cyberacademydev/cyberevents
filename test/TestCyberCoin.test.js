const assertRevert = require('./helpers/AssertRevert');
const bnUtils = require('./helpers/BignumberUtils');
const solidity = require('./helpers/SolidityUtils');
const CyberCoin = artifacts.require('CyberCoin');

contract('CyberCoin', function(accounts) {
  web3.eth.defaultAccount = accounts[0];
  let token;

  beforeEach('set up contract for each test', async function() {
    token = await CyberCoin.new();
  });

  describe('initial', function() {

    const INTERFACEID_ERC165 = '0x01ffc9a7';
    const INTERFACEID_ERC721 = '0x80ac58cd';
    const INTERFACEID_ERC721_EXISTS = '0x4f558e79';
    const INTERFACEID_ERC721_ENUMERABLE = '0x780e9d63';
    const INTERFACEID_ERC721_METADATA = '0x5b5e139f';
    const INTERFACEID_ERC721_TOKENSOF = '0x5a3f2672';

    const totalSupply = 0;

    it('initial tokens amount', async function () {
      assert.equal(bnUtils.parseNumber(await token.totalSupply()), totalSupply);
    });

    it('registered the ERC165 interface', async function() {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC165)), 'true');
    });

    it('registered the ERC721 interface', async function () {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721)), 'true');
    });

    it('registered the ERC721Exists interface', async function () {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_EXISTS)), 'true');
    });

    it('registered the ERC721Enumerable interface', async function () {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_ENUMERABLE)), 'true');
    });

    it('registered the ERC721Metadata interface', async function () {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_METADATA)), 'true');
    });

    it('registered the ERC721TokensOf interface', async function () {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_TOKENSOF)), 'true');
    });

  });

  describe('mint', function() {
    const minter = accounts[0];
    const to = accounts[1];
    const tokenId = 1;
    const eventId = 1;
    let logs = null;

    beforeEach('mint a new token', async function() {
      await token.setMinter(minter);
      const result = await token.mint(to, eventId);
      logs = result.logs;
    });

    context('when successful', function() {

      it('increases the total tokens amount', async function () {
        assert.equal(bnUtils.parseNumber(await token.totalSupply()), 1);
      });

      it('assigns the token to the new owner', async function () {
        assert.equal(bnUtils.parseString(await token.ownerOf(tokenId)), to);
      });

      it('increases the balance of its owner', async function() {
        assert.equal(bnUtils.parseNumber(await token.balanceOf(to)), 1);
      });

      it('assigns the token to the given event ID', async function() {
        assert.equal(bnUtils.parseNumber(await token.eventId(tokenId)), eventId);
      });

      it('adds the token to the list of the owned tokens', async function() {
        assert.equal(bnUtils.parseJSON(await token.tokensOf(to)), '["1"]');
      });

      it('emits a Mint event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Mint');
        assert.equal(logs[0].args.to, to);
        assert.equal(logs[0].args.tokenId.toNumber(), 1);
      });

    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.mint(solidity.ZERO_ADDRESS, eventId));
      });
    });

  });

  describe('setMinter', function() {
    const minter = accounts[0];

    beforeEach('set the minter to the given address', async function() {
      await token.setMinter(minter);
    });

    context('when succesful', function() {
      it('sets the minter to the given address', async function () {
        assert.equal(bnUtils.parseString(await token.minter()), minter);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.setMinter(solidity.ZERO_ADDRESS));
      });
    });

  });

  describe('approve', function() {
    const owner = accounts[0];
    const spender = accounts[1];
    const firstTokenId = 1;
    const secondTokenId = 2;
    const unknownTokenId = 3;
    const eventId = 1;

    before('mint a token', async function() {
      await token.mint(owner, eventId);
      await token.mint(spender, secondTokenId);
      await token.approve(spender, firstTokenId);
    });

    context('when successful', function() {

      it('sets the given token ', async function() {
        
      });

    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.approve(solidity.ZERO_ADDRESS, firstTokenId));
      });
    });

    context('when the given token doesn\'t exist', function() {
      it('reverts', async function() {
        assertRevert(token.approve(spender, unknownTokenId));
      });
    });

    context('when the msg.sender doesn\'t own the given token', function() {
      it('reverts', async function() {
        assertRevert(token.approve(spender, secondTokenId));
      });
    });

  });

});
