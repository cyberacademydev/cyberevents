const assertRevert = require('./helpers/AssertRevert');
const bnUtils = require('./helpers/BignumberUtils');
const solidity = require('./helpers/SolidityUtils');

const CyberCoin = artifacts.require('CyberCoin');
const CyberReceiver = artifacts.require('CyberReceiver');

contract('CyberCoin', function(accounts) {
  web3.eth.defaultAccount = accounts[0];
  const creator = web3.eth.defaultAccount;

  let token;
  let receiver;
  let receiverAddr;

  beforeEach('deploy new contracts for each test', async function() {
    token = await CyberCoin.new({ from: creator });
  });

  describe('initial', function() {
    const INTERFACEID_ERC165 = '0x01ffc9a7';
    const INTERFACEID_ERC721 = '0x80ac58cd';
    const INTERFACEID_ERC721_EXISTS = '0x4f558e79';
    const INTERFACEID_ERC721_ENUMERABLE = '0x780e9d63';
    const INTERFACEID_ERC721_METADATA = '0x5b5e139f';
    const INTERFACEID_ERC721_TOKENSOF = '0x5a3f2672';

    it('initial tokens amount', async function() {
      assert.equal(bnUtils.parseNumber(await token.totalSupply()), 0);
    });

    it('registered the ERC165 interface', async function() {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC165)), 'true');
    });

    it('registered the ERC721 interface', async function() {
      assert.equal(bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721)), 'true');
    });

    it('registered the ERC721Exists interface', async function() {
      assert.equal(
        bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_EXISTS)),
        'true'
      );
    });

    it('registered the ERC721Enumerable interface', async function() {
      assert.equal(
        bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_ENUMERABLE)),
        'true'
      );
    });

    it('registered the ERC721Metadata interface', async function() {
      assert.equal(
        bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_METADATA)),
        'true'
      );
    });

    it('registered the ERC721TokensOf interface', async function() {
      assert.equal(
        bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721_TOKENSOF)),
        'true'
      );
    });
  });

  describe('balanceOf', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
    });

    context('when successfull', function() {
      it('returns its owned tokens amount', async function() {
        assert.equal(bnUtils.parseNumber(await token.balanceOf(accounts[0])), 1);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.balanceOf(solidity.ZERO_ADDRESS));
      });
    });
  });

  describe('ownerOf', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
    });

    context('when successfull', function() {
      it('returns the specified token owners address', async function() {
        assert.equal(bnUtils.parseString(await token.ownerOf(1)), accounts[0]);
      });
    });

    context('when the given token doesn\'t exists', function() {
      it('reverts', async function() {
        assertRevert(token.ownerOf(2));
      });
    });
  });

  describe('tokensOf', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
    });

    context('when successfull', function() {
      it('returns the specified address owned tokens list', async function() {
        assert.equal(bnUtils.parseJSON(await token.tokensOf(accounts[0])), '["1"]');
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.tokensOf(solidity.ZERO_ADDRESS));
      });
    });
  });

  describe('tokenOfOwnerByIndex', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
    });

    context('when successfull', function() {
      it('returns token, that is on the given position in the ownedTokens list of the specified address', async function() {
        assert.equal(bnUtils.parseNumber(await token.tokenOfOwnerByIndex(accounts[0], 0)), 1);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.tokenOfOwnerByIndex(solidity.ZERO_ADDRESS, 0));
      });
    });

    context('when the given index is bigger than the ownedTokens list length', function() {
      it('reverts', async function() {
        assertRevert(token.tokenOfOwnerByIndex(accounts[0], 1));
      });
    });
  });

  describe('tokenByIndex', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
    });

    context('when successfull', function() {
      it('returns token, that is on the given position in the allTokens array', async function() {
        assert.equal(bnUtils.parseNumber(await token.tokenByIndex(0)), 1);
      });
    });

    context('when the given index is bigger than the allTokens list length', function() {
      it('reverts', async function() {
        assertRevert(token.tokenByIndex(1));
      });
    });
  });

  describe('getApproved', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
      await token.approve(accounts[1], 1, {from: accounts[0]});
    });

    context('when successfull', function() {
      it('returns the given token approved address', async function() {
        assert.equal(bnUtils.parseString(await token.getApproved(1)), accounts[1]);
      });
    });

    context('when the given token doesn\'t exists', function() {
      it('reverts', async function() {
        assertRevert(token.getApproved(2));
      });
    });
  });

  describe('isApprovedForAll', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
      await token.setApprovalForAll(accounts[1], true, {from: accounts[0]});
    });

    context('when successfull', function() {
      it('returns the specified account operator approval', async function() {
        assert.equal(bnUtils.parseString(await token.isApprovedForAll(accounts[0], accounts[1])), 'true');
      });
    });

    context('when zero address specified as a tokens owner', function() {
      it('reverts', async function() {
        assertRevert(token.isApprovedForAll(solidity.ZERO_ADDRESS, accounts[1]));
      });
    });

    context('when zero address specified as an approved address', function() {
      it('reverts', async function() {
        assertRevert(token.isApprovedForAll(accounts[0], solidity.ZERO_ADDRESS));
      });
    });
  });

  describe('isApprovedOrOwner', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, {from: creator});
      await token.mint(accounts[0], 1, {from: creator});
    });

    context('when the given address is the token owner', function() {
      it('returns true', async function() {
        assert.equal(bnUtils.parseString(await token.isApprovedOrOwner(accounts[0], 1)), 'true');
      });
    });

    context('when the given address is the token approval', function() {
      it('returns true', async function() {
        await token.approve(accounts[1], 1, {from: accounts[0]});
        assert.equal(bnUtils.parseString(await token.isApprovedOrOwner(accounts[1], 1)), 'true');
      });
    });

    context('when the specified address is zero address', function() {
      it('reverts', async function() {
        assertRevert(token.isApprovedOrOwner(solidity.ZERO_ADDRESS, 1));
      });
    });

    context('when the specified token doesn\'t exists', function() {
      it('reverts', async function() {
        assertRevert(token.isApprovedOrOwner(accounts[0], 2));
      });
    });
  });

    describe('approve', function() {
    const owner = accounts[0];
    const spender = accounts[1];
    const tokenId = 1;
    const unknownTokenId = 2;
    const eventId = 1;

    let logs = null;

    beforeEach('mint and approve tokens', async function() {
      await token.setMinter(owner, { from: creator });
      await token.mint(owner, eventId, { from: creator });
      let result = await token.approve(spender, tokenId, { from: owner });
      logs = result.logs;
    });

    context('when successful', function() {
      it('sets the token approval to the given address', async function() {
        assert.equal(bnUtils.parseString(await token.getApproved(tokenId)), spender);
      });

      it('emits an Approval event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._approved, spender);
        assert.equal(bnUtils.parseNumber(logs[0].args._tokenId), tokenId);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.approve(solidity.ZERO_ADDRESS, tokenId, { from: owner }));
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        assertRevert(token.approve(spender, unknownTokenId, { from: owner }));
      });
    });

    context("when the msg.sender doesn't own the given token", function() {
      it('reverts', async function() {
        assertRevert(token.approve(owner, tokenId, { from: spender }));
      });
    });

    context('when the specified token frozen', function() {
      it('reverts', async function() {
        await token.freezeToken(tokenId, { from: creator });
        assertRevert(await token.clearApproval(tokenId, { from: owner }));
      });
    });
  });

  // TODO setApprovalForAll
  describe('setApprovalForAll', function() {
    
  });

  describe('clearApproval', function() {
    const owner = accounts[0];
    const spender = accounts[1];
    const tokenId = 1;
    const unknownTokenId = 2;
    const eventId = 1;

    let logs = null;

    beforeEach('mint and approve tokens', async function() {
      await token.setMinter(owner, { from: creator });
      await token.mint(owner, eventId, { from: owner });
      await token.approve(spender, tokenId, { from: owner });
      const result = await token.clearApproval(tokenId, { from: owner });
      logs = result.logs;
    });

    context('when successful', function() {
      it('sets the token approval to the zero address', async function() {
        assert.equal(bnUtils.parseString(await token.getApproved(tokenId)), solidity.ZERO_ADDRESS);
      });

      it('emits an Approval event with zero address as spender', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._approved, solidity.ZERO_ADDRESS);
        assert.equal(bnUtils.parseNumber(logs[0].args._tokenId), tokenId);
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        assertRevert(token.clearApproval(unknownTokenId, { from: owner }));
      });
    });

    context("when the msg.sender doesn't own the given token", function() {
      it('reverts', async function() {
        assertRevert(token.clearApproval(tokenId, { from: spender }));
      });
    });

    context('when the specified token frozen', function() {
      it('reverts', async function() {
        await token.freezeToken(tokenId, { from: creator });
        assertRevert(await token.clearApproval(tokenId, { from: owner }));
      });
    });
  });

  // TODO transfer functions test
  describe('transfer', function() {
    const firstTokenId = 1;
    const secondTokenId = 2;
    const thirdTokenId = 3;
    const unknownTokenId = 4;
    const eventId = 1;

    let logs = null;

    beforeEach('mint and approve tokens', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], eventId, { from: creator });
      await token.mint(accounts[1], eventId, { from: creator });
      await token.mint(accounts[1], eventId, { from: creator });
      await token.approve(accounts[0], secondTokenId, { from: accounts[1] });
    });

    const _clearApproval = function() {
      it('sets the token approval to zero address', async function() {
        assert.equal(
          bnUtils.parseString(await token.getApproved(secondTokenId)),
          solidity.ZERO_ADDRESS
        );
      });
    };

    const _removeToken = function(from) {
      it('decreases the sender balance', async function() {
        assert.equal(bnUtils.parseNumber(await token.balanceOf(from)), 1);
      });

      it('moves the last token to the sent token position in the ownedTokens list', async function() {
        assert.equal(
          bnUtils.parseJSON(await token.tokensOf(from)),
          '["' + thirdTokenId.toString() + '"]'
        );
      });
    };

    const _addToken = function(to, ownedToken) {
      it('increases the recepient balance', async function() {
        assert.equal(bnUtils.parseNumber(await token.balanceOf(to)), 2);
      });

      it('sets the token owner to recepient', async function() {
        assert.equal(bnUtils.parseString(await token.ownerOf(secondTokenId)), to);
      });

      it("adds token to the list of the recepient's owned tokens", async function() {
        assert.equal(
          bnUtils.parseJSON(await token.tokensOf(to)),
          '["' + ownedToken.toString() + '","' + secondTokenId.toString() + '"]'
        );
      });
    };

    const approvalEvent = function() {
      it('emits an Approval event', async function() {
        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, accounts[1]);
        assert.equal(logs[0].args._approved, solidity.ZERO_ADDRESS);
        assert.equal(logs[0].args._tokenId, secondTokenId);
      });
    };

    const transferEvent = function(to) {
      it('emits a Transfer event', async function() {
        assert.equal(logs.length, 2);
        assert.equal(logs[1].event, 'Transfer');
        assert.equal(logs[1].args._from, accounts[1]);
        assert.equal(logs[1].args._to, to);
        assert.equal(logs[1].args._tokenId, secondTokenId);
      });
    };

    const transfer = function(from, to, unknown) {
      context('when successfull', function() {
        _clearApproval();
        _removeToken(from);
        _addToken(to, firstTokenId);
        approvalEvent();
        transferEvent(to);
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          assertRevert(
            token.transferFrom(solidity.ZERO_ADDRESS, to, secondTokenId, { from: from })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          assertRevert(
            token.transferFrom(from, solidity.ZERO_ADDRESS, secondTokenId, { from: from })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          assertRevert(token.transferFrom(from, to, secondTokenId, { from: unknown }));
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await token.freezeToken(secondTokenId, { from: creator });
          assertRevert(token.transferFrom(from, to, secondTokenId, { from: from }));
        });
      });
    };

    describe('transferFrom', function() {
      context('transfer the token owned by msg.sender', function() {
        beforeEach('transfer a token', async function() {
          const result = await token.transferFrom(accounts[1], accounts[0], secondTokenId, {
            from: accounts[1]
          });
          logs = result.logs;
        });

        transfer(accounts[1], accounts[0], accounts[2]);
      });

      context('transfer the token approved to msg.sender', function() {
        beforeEach('transfer a token', async function() {
          const result = await token.transferFrom(accounts[1], accounts[0], secondTokenId, {
            from: accounts[0]
          });
          logs = result.logs;
        });

        transfer(accounts[1], accounts[0], accounts[2]);
      });
    });

    describe('safeTransferFrom without additional data', function() {
      
    });

    describe('safeTransferFrom with additional bytes data', function() {});
  });

  describe('mint', function() {
    const minter = accounts[0];
    const to = accounts[1];
    const tokenId = 1;
    const eventId = 1;
    let logs = null;

    beforeEach('mint a token', async function() {
      await token.setMinter(minter, { from: creator });
      let result = await token.mint(to, eventId, { from: minter });
      logs = result.logs;
    });

    context('when successful', function() {
      it('increases the total tokens amount', async function() {
        assert.equal(bnUtils.parseNumber(await token.totalSupply()), 1);
      });

      it('assigns the token to the new owner', async function() {
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
        assert.equal(logs[0].args.tokenId.toNumber(), tokenId);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.mint(solidity.ZERO_ADDRESS, eventId, { from: minter }));
      });
    });

    context("when the msg.sender isn't minter", function() {
      it('reverts', async function() {
        assertRevert(token.mint(to, eventId, { from: to }));
      });
    });
  });

  describe('setMinter', function() {
    const minter = accounts[0];

    beforeEach('set the minter to the given address', async function() {
      await token.setMinter(minter, { from: creator });
    });

    context('when succesful', function() {
      it('sets the minter to the given address', async function() {
        assert.equal(bnUtils.parseString(await token.minter()), minter);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        assertRevert(token.setMinter(solidity.ZERO_ADDRESS, { from: creator }));
      });
    });
  });
});
