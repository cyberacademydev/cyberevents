const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { parseNumber, parseString, parseJSON } = require('./helpers/BignumberUtils');
const { sendTransaction } = require('openzeppelin-solidity/test/helpers/sendTransaction');

const Ticket = artifacts.require('Ticket');
const Receiver = artifacts.require('Receiver');

web3.eth.defaultAccount = web3.eth.accounts[0];

contract('Ticket', function(accounts) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MINT_DATA = '0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658';
  const creator = accounts[0];

  let token;
  let receiver;

  beforeEach('deploy new contract for each test', async function() {
    this.token = await Ticket.new({ from: creator });
    this.receiver = await Receiver.new({ from: creator });
  });

  describe('initial', function() {
    const InterfaceId_ERC165 = '0x01ffc9a7';
    const InterfaceId_ERC721 = '0x80ac58cd';
    const InterfaceId_ERC721Exists = '0x4f558e79';
    const InterfaceId_ERC721Enumerable = '0x780e9d63';
    const InterfaceId_ERC721Metadata = '0x5b5e139f';
    const InterfaceId_ERC721TokensOf = '0x5a3f2672';

    it('initial tokens amount', async function() {
      assert.equal(parseNumber(await this.token.totalSupply()), 0);
    });

    it('registered the ERC165 interface', async function() {
      assert.equal(await this.token.supportsInterface(InterfaceId_ERC165), true);
    });

    it('registered the ERC721 interface', async function() {
      assert.equal(await this.token.supportsInterface(InterfaceId_ERC721), true);
    });

    it('registered the ERC721Exists interface', async function() {
      assert.equal(await this.token.supportsInterface(InterfaceId_ERC721Exists), true);
    });

    it('registered the ERC721Enumerable interface', async function() {
      assert.equal(await this.token.supportsInterface(InterfaceId_ERC721Enumerable), true);
    });

    it('registered the ERC721Metadata interface', async function() {
      assert.equal(await this.token.supportsInterface(InterfaceId_ERC721Metadata), true);
    });

    it('registered the ERC721TokensOf interface', async function() {
      assert.equal(await this.token.supportsInterface(InterfaceId_ERC721TokensOf), true);
    });
  });

  describe('balanceOf', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when the specified address owns some tokens', function() {
      it('returns its owned tokens amount', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(accounts[0])), 1);
      });
    });

    context("when the specified address doesn't own any tokens", function() {
      it('returns 0', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(accounts[1])), 0);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(this.token.balanceOf(ZERO_ADDRESS));
      });
    });
  });

  describe('ownerOf', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when successfull', function() {
      it('returns the specified token owners address', async function() {
        assert.equal(parseString(await this.token.ownerOf(1)), accounts[0]);
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.ownerOf(2));
      });
    });
  });

  describe('tokensOf', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when the specified address owns some tokens', function() {
      it('returns its owned tokens list', async function() {
        assert.equal(parseJSON(await this.token.tokensOf(accounts[0])), '["1"]');
      });
    });

    context("when the specified address doesn't own any tokens", function() {
      it('returns empty JSON', async function() {
        assert.equal(parseJSON(await this.token.tokensOf(accounts[1])), '[]');
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokensOf(ZERO_ADDRESS));
      });
    });
  });

  describe('tokenOfOwnerByIndex', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when successfull', function() {
      it('returns token, that is on the given position in the ownedTokens list of the specified address', async function() {
        assert.equal(parseNumber(await this.token.tokenOfOwnerByIndex(accounts[0], 0)), 1);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokenOfOwnerByIndex(ZERO_ADDRESS, 0));
      });
    });

    context('when the given index is bigger than the ownedTokens array length', function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokenOfOwnerByIndex(accounts[0], 1));
      });
    });
  });

  describe('tokenByIndex', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when successfull', function() {
      it('returns token, that is on the given position in the allTokens array', async function() {
        assert.equal(parseNumber(await this.token.tokenByIndex(0)), 1);
      });
    });

    context('when the given index is bigger than the allTokens array length', function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokenByIndex(1));
      });
    });
  });

  describe('getApproved', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
      await this.token.mint(accounts[1], 1, MINT_DATA, { from: creator });
      await this.token.approve(accounts[1], 1, { from: accounts[0] });
    });

    context('when the specified token approval exists', function() {
      it('returns the given token approved address', async function() {
        assert.equal(parseString(await this.token.getApproved(1)), accounts[1]);
      });
    });

    context('when the specified token approval equals to zero', function() {
      it('returns zero address ', async function() {
        assert.equal(parseString(await this.token.getApproved(2)), ZERO_ADDRESS);
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.getApproved(3));
      });
    });
  });

  describe('isApprovedForAll', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
      await this.token.setApprovalForAll(accounts[1], true, { from: accounts[0] });
    });

    context('when the specified operator approval exists', function() {
      it('returns true', async function() {
        assert.equal(await this.token.isApprovedForAll(accounts[0], accounts[1]), true);
      });
    });

    context("when the specified address doesn't approve all its tokens", function() {
      it('returns false', async function() {
        assert.equal(await this.token.isApprovedForAll(accounts[1], accounts[0]), false);
      });
    });

    context('when zero address specified as a tokens owner', function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedForAll(ZERO_ADDRESS, accounts[1]));
      });
    });

    context('when zero address specified as an approved address', function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedForAll(accounts[0], ZERO_ADDRESS));
      });
    });
  });

  describe('isApprovedOrOwner', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when the given address is the token owner', function() {
      it('returns true', async function() {
        assert.equal(await this.token.isApprovedOrOwner(accounts[0], 1), true);
      });
    });

    context('when the given address is the token approval', function() {
      it('returns true', async function() {
        await this.token.approve(accounts[1], 1, { from: accounts[0] });
        assert.equal(await this.token.isApprovedOrOwner(accounts[1], 1), true);
      });
    });

    context("when the given address isn't owner or approval of the token", function() {
      it('returns false', async function() {
        assert.equal(await this.token.isApprovedOrOwner(accounts[2], 1), false);
      });
    });

    context('when the specified address is zero address', function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedOrOwner(ZERO_ADDRESS, 1));
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedOrOwner(accounts[0], 2));
      });
    });
  });

  describe('exists', function() {
    beforeEach('mint a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when the specified token exists', function() {
      it('returns true', async function() {
        assert.equal(await this.token.exists(1), true);
      });
    });

    context("when the specified tokens doesn't exist", function() {
      it('returns false', async function() {
        assert.equal(await this.token.exists(2), false);
      });
    });
  });

  describe('tokenFrozen', function() {
    beforeEach('mint and freeze tokens', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
      await this.token.freeze(1, { from: creator });
    });

    context('when the specified token frozen', function() {
      it('returns true', async function() {
        assert.equal(await this.token.tokenFrozen(1), true);
      });
    });

    context("when the specified token isn't frozen", function() {
      it('returns false', async function() {
        assert.equal(await this.token.tokenFrozen(2), false);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokenFrozen(3));
      });
    });
  });

  describe('eventId', function() {
    beforeEach('mint and freeze tokens', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
    });

    context('when successfull', function() {
      it('returns the specified token event ID', async function() {
        assert.equal(parseNumber(await this.token.eventId(1)), 1);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.eventId(2));
      });
    });
  });

  describe('tokenURI', function() {
    const tokenId = 1;
    const unknownTokenId = 2;
    const uri = '';

    beforeEach('mint a token with URI', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mintWithURI(accounts[0], 1, MINT_DATA, uri, { from: creator });
    });

    context('when successfull', function() {
      it('returns the specified token URI', async function() {
        assert.equal(parseString(await this.token.tokenURI(tokenId)), uri);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokenURI(unknownTokenId));
      });
    });
  });

  describe('supportsInterface', function() {
    const InterfaceId_ERC721 = '0x80ac58cd';

    context('when the contract supports the specified interface', function() {
      it('returns true', async function() {
        assert.equal(await this.token.supportsInterface(InterfaceId_ERC721), true);
      });
    });

    context("when the contract doesn't support the specified interface", function() {
      it('returns false', async function() {
        assert.equal(await this.token.supportsInterface('0xa4896a3f'), false);
      });
    });

    context('when zero bytes4 given', function() {
      it('reverts', async function() {
        await assertRevert(this.token.supportsInterface('0xffffffff'));
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
      await this.token.setMinter(owner, { from: creator });
      await this.token.mint(owner, eventId, MINT_DATA, { from: creator });
      let result = await this.token.approve(spender, tokenId, { from: owner });
      logs = result.logs;
    });

    context('when successful', function() {
      it('sets the token approval to the given address', async function() {
        assert.equal(parseString(await this.token.getApproved(tokenId)), spender);
      });

      it('emits an Approval event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._approved, spender);
        assert.equal(parseNumber(logs[0].args._tokenId), tokenId);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(this.token.approve(ZERO_ADDRESS, tokenId, { from: owner }));
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.approve(spender, unknownTokenId, { from: owner }));
      });
    });

    context("when the msg.sender doesn't own the given token", function() {
      it('reverts', async function() {
        await assertRevert(this.token.approve(owner, tokenId, { from: spender }));
      });
    });

    context('when the specified token frozen', function() {
      it('reverts', async function() {
        await this.token.freeze(tokenId, { from: creator });
        await assertRevert(this.token.approve(spender, tokenId, { from: owner }));
      });
    });
  });

  describe('setApprovalForAll', function() {
    const owner = accounts[0];
    const spender = accounts[1];

    let logs = null;

    beforeEach('set the operator approval', async function() {
      const result = await this.token.setApprovalForAll(spender, true, { from: owner });
      logs = result.logs;
    });

    context('when successfull', function() {
      it('sets the operator approval to the _approve bool value', async function() {
        assert.equal(await this.token.isApprovedForAll(owner, spender), true);
      });

      it('emits an ApprovalForAll event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'ApprovalForAll');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._operator, spender);
        assert.equal(logs[0].args._approved, true);
      });
    });

    context('when zero address specified as tokens spender', function() {
      it('reverts', async function() {
        await assertRevert(this.token.setApprovalForAll(ZERO_ADDRESS, true, { from: owner }));
      });
    });
  });

  describe('clearApproval', function() {
    const owner = accounts[0];
    const spender = accounts[1];
    const tokenId = 1;
    const unknownTokenId = 2;
    const eventId = 1;

    let logs = null;

    beforeEach('mint and approve tokens', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(owner, eventId, MINT_DATA, { from: creator });
      await this.token.approve(spender, tokenId, { from: owner });
      const result = await this.token.clearApproval(tokenId, { from: owner });
      logs = result.logs;
    });

    context('when successful', function() {
      it('sets the token approval to the zero address', async function() {
        assert.equal(parseString(await this.token.getApproved(tokenId)), ZERO_ADDRESS);
      });

      it('emits an Approval event with zero address as spender', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._approved, ZERO_ADDRESS);
        assert.equal(parseNumber(logs[0].args._tokenId), tokenId);
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.clearApproval(unknownTokenId, { from: owner }));
      });
    });

    context("when the msg.sender doesn't own the given token", function() {
      it('reverts', async function() {
        await assertRevert(this.token.clearApproval(tokenId, { from: spender }));
      });
    });

    context('when the specified token frozen', function() {
      it('reverts', async function() {
        await this.token.freeze(1, { from: creator });
        await assertRevert(this.token.clearApproval(tokenId, { from: owner }));
      });
    });
  });

  describe('transfer', function() {
    const firstTokenId = 1;
    const secondTokenId = 2;
    const thirdTokenId = 3;
    const unknownTokenId = 4;
    const eventId = 1;
    const data = '0x74657374';

    let logs = null;

    beforeEach('mint and approve tokens', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], eventId, MINT_DATA, { from: creator });
      await this.token.mint(accounts[1], eventId, MINT_DATA, { from: creator });
      await this.token.mint(accounts[1], eventId, MINT_DATA, { from: creator });
      await this.token.approve(accounts[0], secondTokenId, { from: accounts[1] });
    });

    const _clearApproval = function() {
      it('sets the token approval to zero address', async function() {
        assert.equal(parseString(await this.token.getApproved(secondTokenId)), ZERO_ADDRESS);
      });
    };

    const _removeToken = function() {
      it('decreases the sender balance', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(accounts[1])), 1);
      });

      it('moves the last token to the sent token position in the ownedTokens list', async function() {
        assert.equal(
          parseJSON(await this.token.tokensOf(accounts[1])),
          '["' + thirdTokenId.toString() + '"]'
        );
      });
    };

    const approvalEvent = function() {
      it('emits an Approval event', async function() {
        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, accounts[1]);
        assert.equal(logs[0].args._approved, ZERO_ADDRESS);
        assert.equal(logs[0].args._tokenId, secondTokenId);
      });
    };

    const transferFrom = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(parseNumber(await this.token.balanceOf(accounts[0])), 2);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(parseString(await this.token.ownerOf(secondTokenId)), accounts[0]);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            parseJSON(await this.token.tokensOf(accounts[0])),
            '["' + firstTokenId.toString() + '","' + secondTokenId.toString() + '"]'
          );
        });

        approvalEvent();

        it('emits a Transfer event', async function() {
          assert.equal(logs.length, 2);
          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args._from, accounts[1]);
          assert.equal(logs[1].args._to, accounts[0]);
          assert.equal(logs[1].args._tokenId, secondTokenId);
        });
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.transferFrom(ZERO_ADDRESS, accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.transferFrom(accounts[1], ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.transferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[2]
            })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await this.token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            this.token.transferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.transferFrom(accounts[1], accounts[0], unknownTokenId, {
              from: accounts[1]
            })
          );
        });
      });
    };

    const safeTransferFromToAccount = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(parseNumber(await this.token.balanceOf(accounts[0])), 2);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(parseString(await this.token.ownerOf(secondTokenId)), accounts[0]);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            parseJSON(await this.token.tokensOf(accounts[0])),
            '["' + firstTokenId.toString() + '","' + secondTokenId.toString() + '"]'
          );
        });

        approvalEvent();

        it('emits a Transfer event', async function() {
          assert.equal(logs.length, 2);
          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args._from, accounts[1]);
          assert.equal(logs[1].args._to, accounts[0]);
          assert.equal(logs[1].args._tokenId, secondTokenId);
        });
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.safeTransferFrom(ZERO_ADDRESS, accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.safeTransferFrom(accounts[1], ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.safeTransferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[2]
            })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await this.token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            this.token.safeTransferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.transferFrom(accounts[1], accounts[0], unknownTokenId, {
              from: accounts[1]
            })
          );
        });
      });
    };

    const safeTransferFromToContract = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(parseNumber(await this.token.balanceOf(this.receiver.address)), 1);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(parseString(await this.token.ownerOf(secondTokenId)), this.receiver.address);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            parseJSON(await this.token.tokensOf(this.receiver.address)),
            '["' + secondTokenId.toString() + '"]'
          );
        });

        approvalEvent();

        it('emits a Transfer event', async function() {
          assert.equal(logs.length, 2);
          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args._from, accounts[1]);
          assert.equal(logs[1].args._to, this.receiver.address);
          assert.equal(logs[1].args._tokenId, secondTokenId);
        });
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.safeTransferFrom(ZERO_ADDRESS, this.receiver.address, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.safeTransferFrom(accounts[1], ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.safeTransferFrom(accounts[1], this.receiver.address, secondTokenId, {
              from: accounts[2]
            })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await this.token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            this.token.safeTransferFrom(accounts[1], this.receiver.address, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            this.token.transferFrom(accounts[1], accounts[0], unknownTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context(
        "when the specified contract doesn't implement the ERC721Receiver interface",
        function() {
          it('reverts', async function() {
            await assertRevert(
              this.token.safeTransferFrom(accounts[1], this.token.address, secondTokenId, {
                from: accounts[1]
              })
            );
          });
        }
      );
    };

    const safeTransferFromWithDataToAccount = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(parseNumber(await this.token.balanceOf(accounts[0])), 2);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(parseString(await this.token.ownerOf(secondTokenId)), accounts[0]);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            parseJSON(await this.token.tokensOf(accounts[0])),
            '["' + firstTokenId.toString() + '","' + secondTokenId.toString() + '"]'
          );
        });

        approvalEvent();

        it('emits a Transfer event', async function() {
          assert.equal(logs.length, 2);
          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args._from, accounts[1]);
          assert.equal(logs[1].args._to, accounts[0]);
          assert.equal(logs[1].args._tokenId, secondTokenId);
        });
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [ZERO_ADDRESS, accounts[0], secondTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], ZERO_ADDRESS, secondTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], accounts[0], secondTokenId, data],
              { from: accounts[2] }
            )
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await this.token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], accounts[0], secondTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], accounts[0], unknownTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });
    };

    const safeTransferFromWithDataToContract = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(parseNumber(await this.token.balanceOf(this.receiver.address)), 1);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(parseString(await this.token.ownerOf(secondTokenId)), this.receiver.address);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            parseJSON(await this.token.tokensOf(this.receiver.address)),
            '["' + secondTokenId.toString() + '"]'
          );
        });

        approvalEvent();

        it('emits a Transfer event', async function() {
          assert.equal(logs.length, 2);
          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args._from, accounts[1]);
          assert.equal(logs[1].args._to, this.receiver.address);
          assert.equal(logs[1].args._tokenId, secondTokenId);
        });
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [ZERO_ADDRESS, this.receiver.address, secondTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], ZERO_ADDRESS, secondTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], this.receiver.address, secondTokenId, data],
              { from: accounts[2] }
            )
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await this.token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], this.receiver.address, secondTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], this.receiver.address, unknownTokenId, data],
              { from: accounts[1] }
            )
          );
        });
      });

      context(
        "when the specified contract doesn't implement the ERC721Receiver interface",
        function() {
          it('reverts', async function() {
            await assertRevert(
              sendTransaction(
                this.token,
                'safeTransferFrom',
                'address,address,uint256,bytes',
                [accounts[1], this.token.address, secondTokenId, data],
                { from: accounts[1] }
              )
            );
          });
        }
      );
    };

    describe('transferFrom', function() {
      context('transfer the token owned by msg.sender', function() {
        beforeEach('transfer a token', async function() {
          const result = await this.token.transferFrom(accounts[1], accounts[0], secondTokenId, {
            from: accounts[1]
          });
          logs = result.logs;
        });

        transferFrom();
      });

      context('transfer the token approved to msg.sender', function() {
        beforeEach('transfer a token', async function() {
          const result = await this.token.transferFrom(accounts[1], accounts[0], secondTokenId, {
            from: accounts[0]
          });
          logs = result.logs;
        });

        transferFrom();
      });
    });

    describe('safeTransferFrom', function() {
      context('transfer the token to the default account', function() {
        context('transfer the token owned by msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await this.token.safeTransferFrom(
              accounts[1],
              accounts[0],
              secondTokenId,
              {
                from: accounts[1]
              }
            );
            logs = result.logs;
          });

          safeTransferFromToAccount();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await this.token.safeTransferFrom(
              accounts[1],
              accounts[0],
              secondTokenId,
              {
                from: accounts[0]
              }
            );
            logs = result.logs;
          });

          safeTransferFromToAccount();
        });
      });

      context('transfer the token to the smart contract', function() {
        context('transfer the token owned by msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await this.token.safeTransferFrom(
              accounts[1],
              this.receiver.address,
              secondTokenId,
              { from: accounts[1] }
            );
            logs = result.logs;
          });

          safeTransferFromToContract();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await this.token.safeTransferFrom(
              accounts[1],
              this.receiver.address,
              secondTokenId,
              { from: accounts[0] }
            );
            logs = result.logs;
          });

          safeTransferFromToContract();
        });
      });
    });

    describe('safeTransferFrom with bytes data', function() {
      context('transfer the token to the default account', function() {
        context('transfer the token owned by msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], accounts[0], secondTokenId, data],
              { from: accounts[1] }
            );
            logs = result.logs;
          });

          safeTransferFromWithDataToAccount();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], accounts[0], secondTokenId, data],
              { from: accounts[0] }
            );
            logs = result.logs;
          });

          safeTransferFromWithDataToAccount();
        });
      });

      context('transfer the token to the smart contract', function() {
        context('transfer the token owned by msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], this.receiver.address, secondTokenId, data],
              { from: accounts[1] }
            );
            logs = result.logs;
          });

          safeTransferFromWithDataToContract();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await sendTransaction(
              this.token,
              'safeTransferFrom',
              'address,address,uint256,bytes',
              [accounts[1], this.receiver.address, secondTokenId, data],
              { from: accounts[0] }
            );
            logs = result.logs;
          });

          safeTransferFromWithDataToContract();
        });
      });
    });
  });

  describe('freeze', function() {
    const tokenId = 1;
    const unknownTokenId = 2;

    beforeEach('mint and freeze a token', async function() {
      await this.token.setMinter(creator, { from: creator });
      await this.token.mint(accounts[0], 1, MINT_DATA, { from: creator });
      await this.token.freeze(tokenId, { from: creator });
    });

    context('when successfull', function() {
      it('freezes the token', async function() {
        assert.equal(await this.token.tokenFrozen(tokenId), true);
      });
    });

    context("when the msg.sender isn't minter", function() {
      it('reverts', async function() {
        await assertRevert(this.token.freeze(tokenId, { from: accounts[1] }));
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.freeze(unknownTokenId, { from: creator }));
      });
    });

    context('when the specified token already frozen', function() {
      it('reverts', async function() {
        await assertRevert(this.token.freeze(tokenId, { from: creator }));
      });
    });
  });

  describe('mint', function() {
    const minter = accounts[0];
    const to = accounts[1];
    const tokenId = 1;
    const eventId = 1;
    let logs = null;

    beforeEach('mint a token', async function() {
      await this.token.setMinter(minter, { from: creator });
      let result = await this.token.mint(to, eventId, MINT_DATA, { from: minter });
      logs = result.logs;
    });

    context('when successful', function() {
      it('increases the total tokens amount', async function() {
        assert.equal(parseNumber(await this.token.totalSupply()), 1);
      });

      it('assigns the token to the new owner', async function() {
        assert.equal(parseString(await this.token.ownerOf(tokenId)), to);
      });

      it('increases the balance of its owner', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(to)), 1);
      });

      it('assigns the token to the given event ID', async function() {
        assert.equal(parseNumber(await this.token.eventId(tokenId)), eventId);
      });

      it('sets the token data to the specified value', async function() {
        assert.equal(parseString(await this.token.getTokenData(tokenId)), MINT_DATA);
      });

      it('adds the token to the list of the owned tokens', async function() {
        assert.equal(parseJSON(await this.token.tokensOf(to)), '["1"]');
      });

      it('adds the token to the allTokens array', async function() {
        assert.equal(parseNumber(await this.token.tokenByIndex(0)), 1);
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
        await assertRevert(
          this.token.mint(ZERO_ADDRESS, eventId, MINT_DATA, {
            from: minter
          })
        );
      });
    });

    context("when the msg.sender isn't minter", function() {
      it('reverts', async function() {
        await assertRevert(this.token.mint(to, eventId, MINT_DATA, { from: to }));
      });
    });
  });

  describe('mintWithURI', function() {
    const minter = accounts[0];
    const to = accounts[1];
    const tokenId = 1;
    const eventId = 1;
    const uri = '';

    let logs = null;

    beforeEach('mint a token', async function() {
      await this.token.setMinter(minter, { from: creator });
      let result = await this.token.mintWithURI(to, eventId, MINT_DATA, uri, { from: minter });
      logs = result.logs;
    });

    context('when successful', function() {
      it('increases the total tokens amount', async function() {
        assert.equal(parseNumber(await this.token.totalSupply()), 1);
      });

      it('assigns the token to the new owner', async function() {
        assert.equal(parseString(await this.token.ownerOf(tokenId)), to);
      });

      it('increases the balance of its owner', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(to)), 1);
      });

      it('assigns the token to the given event ID', async function() {
        assert.equal(parseNumber(await this.token.eventId(tokenId)), eventId);
      });

      it('sets the token data to the specified value', async function() {
        assert.equal(parseString(await this.token.getTokenData(tokenId)), MINT_DATA);
      });

      it('adds the token to the list of the owned tokens', async function() {
        assert.equal(parseJSON(await this.token.tokensOf(to)), '["1"]');
      });

      it('adds the token to the allTokens array', async function() {
        assert.equal(parseNumber(await this.token.tokenByIndex(0)), 1);
      });

      it('sets the token URI to the specified value', async function() {
        assert.equal(parseString(await this.token.tokenURI(tokenId)), uri);
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
        await assertRevert(
          this.token.mintWithURI(ZERO_ADDRESS, eventId, MINT_DATA, uri, {
            from: minter
          })
        );
      });
    });

    context("when the msg.sender isn't minter", function() {
      it('reverts', async function() {
        await assertRevert(this.token.mintWithURI(to, eventId, MINT_DATA, uri, { from: to }));
      });
    });
  });

  describe('setMinter', function() {
    const minter = accounts[0];

    beforeEach('set the minter to the given address', async function() {
      await this.token.setMinter(minter, { from: creator });
    });

    context('when succesful', function() {
      it('sets the minter to the given address', async function() {
        assert.equal(parseString(await this.token.minter()), minter);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(this.token.setMinter(ZERO_ADDRESS, { from: creator }));
      });
    });
  });
});
