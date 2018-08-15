const assertRevert = require('./helpers/AssertRevert');
const bnUtils = require('./helpers/BignumberUtils');
const solidity = require('./helpers/SolidityUtils');
const CyberCoin = artifacts.require('CyberCoin');

contract('CyberCoin', function(accounts) {
  web3.eth.defaultAccount = accounts[0];
  const creator = web3.eth.defaultAccount;

  let token;

  beforeEach('deploy new contract for each test', async function() {
    token = await CyberCoin.new({ from: creator });
  });

  describe('initial', function() {
    const INTERFACEID_ERC165 = '0x01ffc9a7';
    const INTERFACEID_ERC721 = '0x80ac58cd';
    const INTERFACEID_ERC721_EXISTS = '0x4f558e79';
    const INTERFACEID_ERC721_ENUMERABLE = '0x780e9d63';
    const INTERFACEID_ERC721_METADATA = '0x5b5e139f';
    const INTERFACEID_ERC721_TOKENSOF = '0x5a3f2672';

    const totalSupply = 0;

    it('initial tokens amount', async function() {
      assert.equal(bnUtils.parseNumber(await token.totalSupply()), totalSupply);
    });

    it('registered the ERC165 interface', async function() {
      assert.equal(
        bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC165)),
        'true'
      );
    });

    it('registered the ERC721 interface', async function() {
      assert.equal(
        bnUtils.parseString(await token.supportsInterface(INTERFACEID_ERC721)),
        'true'
      );
    });

    it('registered the ERC721Exists interface', async function() {
      assert.equal(
        bnUtils.parseString(
          await token.supportsInterface(INTERFACEID_ERC721_EXISTS)
        ),
        'true'
      );
    });

    it('registered the ERC721Enumerable interface', async function() {
      assert.equal(
        bnUtils.parseString(
          await token.supportsInterface(INTERFACEID_ERC721_ENUMERABLE)
        ),
        'true'
      );
    });

    it('registered the ERC721Metadata interface', async function() {
      assert.equal(
        bnUtils.parseString(
          await token.supportsInterface(INTERFACEID_ERC721_METADATA)
        ),
        'true'
      );
    });

    it('registered the ERC721TokensOf interface', async function() {
      assert.equal(
        bnUtils.parseString(
          await token.supportsInterface(INTERFACEID_ERC721_TOKENSOF)
        ),
        'true'
      );
    });
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
        assert.equal(
          bnUtils.parseNumber(await token.eventId(tokenId)),
          eventId
        );
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
        assertRevert(
          token.mint(solidity.ZERO_ADDRESS, eventId, { from: minter })
        );
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
        assert.equal(
          bnUtils.parseString(await token.getApproved(tokenId)),
          spender
        );
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
        assertRevert(
          token.approve(solidity.ZERO_ADDRESS, tokenId, { from: owner })
        );
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

  describe('clear approval', function() {
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
        assert.equal(
          bnUtils.parseString(await token.getApproved(tokenId)),
          solidity.ZERO_ADDRESS
        );
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

  // TODO transfer functions test helo
  describe('transfer', function() {
    const firstAccount = accounts[0];
    const secondAccount = accounts[1];
    const firstTokenId = 1;
    const secondTokenId = 2;
    const thirdTokenId = 3;
    const unknownTokenId = 4;
    const eventId = 1;

    let from = null;
    let to = null;
    let tokenId = null;
    let logs = null;

    beforeEach('mint and approve tokens', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(firstAccount, eventId, { from: creator });
      await token.mint(secondAccount, eventId, { from: creator });
      await token.mint(secondAccount, eventId, { from: creator });
      await token.approve(firstAccount, secondTokenId, { from: secondAccount });
    });

    const _clearApproval = function() {
      it('sets the token approval to zero address', async function() {
        assert.equal(
          bnUtils.parseString(await token.getApproved(tokenId)),
          solidity.ZERO_ADDRESS
        );
      });
    };

    const _removeToken = function(ownedToken) {
      it('decreases the sender balance', async function() {
        assert.equal(bnUtils.parseNumber(await token.balanceOf(from)), 1);
      });

      it('moves the last token to the sent token position in the ownedTokens list', async function() {
        assert.equal(
          bnUtils.parseJSON(await token.tokensOf(from)),
          '["' + ownedToken.toString() + '"]'
        );
      });
    };

    const _addTokenTo = function(ownedToken) {
      it('increases the recepient balance', async function() {
        assert.equal(bnUtils.parseNumber(await token.balanceOf(to)), 2);
      });

      it('sets the token owner to recepient', async function() {
        assert.equal(bnUtils.parseString(await token.ownerOf(tokenId)), to);
      });

      it("adds token to the list of the recepient's owned tokens", async function() {
        assert.equal(
          bnUtils.parseJSON(await token.tokensOf(to)),
          '["' + ownedToken.toString() + '","' + tokenId.toString() + '"]'
        );
      });
    };

    const approvalEvent = function() {
      it('emits an Approval event', async function() {
        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, from);
        assert.equal(logs[0].args._approved, solidity.ZERO_ADDRESS);
        assert.equal(logs[0].args._tokenId, tokenId);
      });
    };

    const transferEvent = function() {
      it('emits a Transfer event', async function() {
        assert.equal(logs.length, 2);
        assert.equal(logs[1].event, 'Transfer');
        assert.equal(logs[1].args._from, from);
        assert.equal(logs[1].args._to, to);
        assert.equal(logs[1].args._tokenId, tokenId);
      });
    };

    describe('transferFrom', function() {
      context('transfer the token owned by msg.sender', function() {
        from = secondAccount;
        to = firstAccount;
        tokenId = secondTokenId;

        beforeEach('transfer token', async function() {
          const result = await token.transferFrom(from, to, tokenId, {
            from: from
          });
          logs = result.logs;
        });

        context('when successfull', function() {
          _clearApproval();
          _removeToken(thirdTokenId);
          _addTokenTo(firstTokenId);
          approvalEvent();
          transferEvent();
        });
      });

      context('transfer the token approved to msg.sender', function() {});
    });

    context('safeTransferFrom', function() {});

    context('safeTransferFrom with additional bytes metadata', function() {});
  });
});
