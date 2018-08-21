const assertRevert = require('./helpers/AssertRevert');
const bignumberUtils = require('./helpers/BignumberUtils');
const sendTransaction = require('./helpers/SendTransaction');
const solidity = require('./helpers/SolidityUtils');

const CyberCoin = artifacts.require('CyberCoin');
const CyberReceiver = artifacts.require('CyberReceiver');

contract('CyberCoin', function(accounts) {
  web3.eth.defaultAccount = accounts[0];
  const creator = accounts[0];

  let token;
  let receiver;

  beforeEach('deploy new contract for each test', async function() {
    token = await CyberCoin.new({ from: creator });
    receiver = await CyberReceiver.new({ from: creator });
  });

  describe('initial', function() {
    const INTERFACEID_ERC165 = '0x01ffc9a7';
    const INTERFACEID_ERC721 = '0x80ac58cd';
    const INTERFACEID_ERC721_EXISTS = '0x4f558e79';
    const INTERFACEID_ERC721_ENUMERABLE = '0x780e9d63';
    const INTERFACEID_ERC721_METADATA = '0x5b5e139f';
    const INTERFACEID_ERC721_TOKENSOF = '0x5a3f2672';

    it('initial tokens amount', async function() {
      assert.equal(bignumberUtils.parseNumber(await token.totalSupply()), 0);
    });

    it('registered the ERC165 interface', async function() {
      assert.equal(await token.supportsInterface(INTERFACEID_ERC165), true);
    });

    it('registered the ERC721 interface', async function() {
      assert.equal(await token.supportsInterface(INTERFACEID_ERC721), true);
    });

    it('registered the ERC721Exists interface', async function() {
      assert.equal(await token.supportsInterface(INTERFACEID_ERC721_EXISTS), true);
    });

    it('registered the ERC721Enumerable interface', async function() {
      assert.equal(await token.supportsInterface(INTERFACEID_ERC721_ENUMERABLE), true);
    });

    it('registered the ERC721Metadata interface', async function() {
      assert.equal(await token.supportsInterface(INTERFACEID_ERC721_METADATA), true);
    });

    it('registered the ERC721TokensOf interface', async function() {
      assert.equal(await token.supportsInterface(INTERFACEID_ERC721_TOKENSOF), true);
    });
  });

  describe('balanceOf', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when the specified address owns some tokens', function() {
      it('returns its owned tokens amount', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.balanceOf(accounts[0])), 1);
      });
    });

    context("when the specified address doesn't own any tokens", function() {
      it('returns 0', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.balanceOf(accounts[1])), 0);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(token.balanceOf(solidity.ZERO_ADDRESS));
      });
    });
  });

  describe('ownerOf', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when successfull', function() {
      it('returns the specified token owners address', async function() {
        assert.equal(bignumberUtils.parseString(await token.ownerOf(1)), accounts[0]);
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(token.ownerOf(2));
      });
    });
  });

  describe('tokensOf', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when the specified address owns some tokens', function() {
      it('returns its owned tokens list', async function() {
        assert.equal(bignumberUtils.parseJSON(await token.tokensOf(accounts[0])), '["1"]');
      });
    });

    context("when the specified address doesn't own any tokens", function() {
      it('returns empty JSON', async function() {
        assert.equal(bignumberUtils.parseJSON(await token.tokensOf(accounts[1])), '[]');
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(token.tokensOf(solidity.ZERO_ADDRESS));
      });
    });
  });

  describe('tokenOfOwnerByIndex', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when successfull', function() {
      it(
        'returns token, that is on the given position in the ownedTokens list of the specified address', 
        async function() {
          assert.equal(
            bignumberUtils.parseNumber(await token.tokenOfOwnerByIndex(accounts[0], 0)),
            1
          );
        }
      );
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(token.tokenOfOwnerByIndex(solidity.ZERO_ADDRESS, 0));
      });
    });

    context('when the given index is bigger than the ownedTokens array length', function() {
      it('reverts', async function() {
        await assertRevert(token.tokenOfOwnerByIndex(accounts[0], 1));
      });
    });
  });

  describe('tokenByIndex', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when successfull', function() {
      it('returns token, that is on the given position in the allTokens array', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.tokenByIndex(0)), 1);
      });
    });

    context('when the given index is bigger than the allTokens array length', function() {
      it('reverts', async function() {
        await assertRevert(token.tokenByIndex(1));
      });
    });
  });

  describe('getApproved', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
      await token.mint(accounts[1], 1, { from: creator });
      await token.approve(accounts[1], 1, { from: accounts[0] });
    });

    context('when the specified token approval exists', function() {
      it('returns the given token approved address', async function() {
        assert.equal(bignumberUtils.parseString(await token.getApproved(1)), accounts[1]);
      });
    });

    context('when the specified token approval equals to zero', function() {
      it('returns zero address ', async function() {
        assert.equal(bignumberUtils.parseString(await token.getApproved(2)), solidity.ZERO_ADDRESS);
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(token.getApproved(3));
      });
    });
  });

  describe('isApprovedForAll', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
      await token.setApprovalForAll(accounts[1], true, { from: accounts[0] });
    });

    context('when the specified operator approval exists', function() {
      it('returns true', async function() {
        assert.equal(await token.isApprovedForAll(accounts[0], accounts[1]), true);
      });
    });

    context("when the specified address doesn't approve all its tokens", function() {
      it('returns false', async function() {
        assert.equal(await token.isApprovedForAll(accounts[1], accounts[0]), false);
      });
    });

    context('when zero address specified as a tokens owner', function() {
      it('reverts', async function() {
        await assertRevert(token.isApprovedForAll(solidity.ZERO_ADDRESS, accounts[1]));
      });
    });

    context('when zero address specified as an approved address', function() {
      it('reverts', async function() {
        await assertRevert(token.isApprovedForAll(accounts[0], solidity.ZERO_ADDRESS));
      });
    });
  });

  describe('isApprovedOrOwner', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when the given address is the token owner', function() {
      it('returns true', async function() {
        assert.equal(await token.isApprovedOrOwner(accounts[0], 1), true);
      });
    });

    context('when the given address is the token approval', function() {
      it('returns true', async function() {
        await token.approve(accounts[1], 1, { from: accounts[0] });
        assert.equal(await token.isApprovedOrOwner(accounts[1], 1), true);
      });
    });

    context("when the given address isn't owner or approval of the token", function() {
      it('returns false', async function() {
        assert.equal(await token.isApprovedOrOwner(accounts[2], 1), false);
      });
    });

    context('when the specified address is zero address', function() {
      it('reverts', async function() {
        await assertRevert(token.isApprovedOrOwner(solidity.ZERO_ADDRESS, 1));
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(token.isApprovedOrOwner(accounts[0], 2));
      });
    });
  });

  describe('exists', function() {
    beforeEach('mint a token', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when the specified token exists', function() {
      it('returns true', async function() {
        assert.equal(await token.exists(1), true);
      });
    });

    context("when the specified tokens doesn't exist", function() {
      it('returns false', async function() {
        assert.equal(await token.exists(2), false);
      });
    });
  });

  describe('tokenFrozen', function() {
    beforeEach('mint and freeze tokens', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
      await token.freeze(1, { from: creator });
    });

    context('when the specified token frozen', function() {
      it('returns true', async function() {
        assert.equal(await token.tokenFrozen(1), true);
      });
    });

    context("when the specified token isn't frozen", function() {
      it('returns false', async function() {
        assert.equal(await token.tokenFrozen(2), false);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(token.tokenFrozen(3));
      });
    });
  });

  describe('eventId', function() {
    beforeEach('mint and freeze tokens', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(accounts[0], 1, { from: creator });
    });

    context('when successfull', function() {
      it('returns the specified token event ID', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.eventId(1)), 1);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(token.eventId(2));
      });
    });
  });

  // TODO: token URI
  describe('tokenURI', function() {});

  describe('supportsInterface', function() {
    const INTERFACEID_ERC721 = '0x80ac58cd';

    context('when the contract supports the specified interface', function() {
      it('returns true', async function() {
        assert.equal(await token.supportsInterface(INTERFACEID_ERC721), true);
      });
    });

    context("when the contract doesn't support the specified interface", function() {
      it('returns false', async function() {
        assert.equal(await token.supportsInterface('0xa4896a3f'), false);
      });
    });

    context('when zero bytes given', function() {
      it('reverts', async function() {
        await assertRevert(token.supportsInterface('0xffffffff'));
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
        assert.equal(bignumberUtils.parseString(await token.getApproved(tokenId)), spender);
      });

      it('emits an Approval event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._approved, spender);
        assert.equal(bignumberUtils.parseNumber(logs[0].args._tokenId), tokenId);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(token.approve(solidity.ZERO_ADDRESS, tokenId, { from: owner }));
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(token.approve(spender, unknownTokenId, { from: owner }));
      });
    });

    context("when the msg.sender doesn't own the given token", function() {
      it('reverts', async function() {
        await assertRevert(token.approve(owner, tokenId, { from: spender }));
      });
    });

    context('when the specified token frozen', function() {
      it('reverts', async function() {
        await token.freeze(tokenId, { from: creator });
        await assertRevert(token.approve(spender, tokenId, { from: owner }));
      });
    });
  });

  // TODO: setApprovalForAll
  describe('setApprovalForAll', function() {});

  describe('clearApproval', function() {
    const owner = accounts[0];
    const spender = accounts[1];
    const tokenId = 1;
    const unknownTokenId = 2;
    const eventId = 1;

    let logs = null;

    beforeEach('mint and approve tokens', async function() {
      await token.setMinter(creator, { from: creator });
      await token.mint(owner, eventId, { from: creator });
      await token.approve(spender, tokenId, { from: owner });
      const result = await token.clearApproval(tokenId, { from: owner });
      logs = result.logs;
    });

    context('when successful', function() {
      it('sets the token approval to the zero address', async function() {
        assert.equal(
          bignumberUtils.parseString(await token.getApproved(tokenId)),
          solidity.ZERO_ADDRESS
        );
      });

      it('emits an Approval event with zero address as spender', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, owner);
        assert.equal(logs[0].args._approved, solidity.ZERO_ADDRESS);
        assert.equal(bignumberUtils.parseNumber(logs[0].args._tokenId), tokenId);
      });
    });

    context("when the given token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(token.clearApproval(unknownTokenId, { from: owner }));
      });
    });

    context("when the msg.sender doesn't own the given token", function() {
      it('reverts', async function() {
        await assertRevert(token.clearApproval(tokenId, { from: spender }));
      });
    });

    context('when the specified token frozen', function() {
      it('reverts', async function() {
        await token.freeze(1, { from: creator });
        await assertRevert(token.clearApproval(tokenId, { from: owner }));
      });
    });
  });

  describe('transfer', function() {
    const firstTokenId = 1;
    const secondTokenId = 2;
    const thirdTokenId = 3;
    const unknownTokenId = 4;
    const eventId = 1;
    const data = '0x00';

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
          bignumberUtils.parseString(await token.getApproved(secondTokenId)),
          solidity.ZERO_ADDRESS
        );
      });
    };

    const _removeToken = function() {
      it('decreases the sender balance', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.balanceOf(accounts[1])), 1);
      });

      it('moves the last token to the sent token position in the ownedTokens list', async function() {
        assert.equal(
          bignumberUtils.parseJSON(await token.tokensOf(accounts[1])),
          '["' + thirdTokenId.toString() + '"]'
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

    const transferFrom = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(bignumberUtils.parseNumber(await token.balanceOf(accounts[0])), 2);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(bignumberUtils.parseString(await token.ownerOf(secondTokenId)), accounts[0]);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            bignumberUtils.parseJSON(await token.tokensOf(accounts[0])),
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
            token.transferFrom(solidity.ZERO_ADDRESS, accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            token.transferFrom(accounts[1], solidity.ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            token.transferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[2]
            })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            token.transferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            token.transferFrom(accounts[1], accounts[0], unknownTokenId, {
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
          assert.equal(bignumberUtils.parseNumber(await token.balanceOf(accounts[0])), 2);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(bignumberUtils.parseString(await token.ownerOf(secondTokenId)), accounts[0]);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            bignumberUtils.parseJSON(await token.tokensOf(accounts[0])),
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
            token.safeTransferFrom(solidity.ZERO_ADDRESS, accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            token.safeTransferFrom(accounts[1], solidity.ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            token.safeTransferFrom(accounts[1], accounts[0], secondTokenId, { from: accounts[2] })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            token.safeTransferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            token.transferFrom(accounts[1], accounts[0], unknownTokenId, {
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
          assert.equal(bignumberUtils.parseNumber(await token.balanceOf(receiver.address)), 1);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(
            bignumberUtils.parseString(await token.ownerOf(secondTokenId)),
            receiver.address
          );
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            bignumberUtils.parseJSON(await token.tokensOf(receiver.address)),
            '["' + secondTokenId.toString() + '"]'
          );
        });

        approvalEvent();

        it('emits a Transfer event', async function() {
          assert.equal(logs.length, 2);
          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args._from, accounts[1]);
          assert.equal(logs[1].args._to, receiver.address);
          assert.equal(logs[1].args._tokenId, secondTokenId);
        });
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          await assertRevert(
            token.safeTransferFrom(solidity.ZERO_ADDRESS, receiver.address, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            token.safeTransferFrom(accounts[1], solidity.ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            token.safeTransferFrom(accounts[1], receiver.address, secondTokenId, {
              from: accounts[2]
            })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            token.safeTransferFrom(accounts[1], receiver.address, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            token.transferFrom(accounts[1], accounts[0], unknownTokenId, {
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
              token.safeTransferFrom(accounts[1], token.address, secondTokenId, {
                from: accounts[1]
              })
            );
          });
        }
      );
    };

    const safeTransferFromTransaction = function(from, to, tokenId, opts) {
      return sendTransaction(
        token,
        'safeTransferFrom',
        'address,address,uint256,bytes',
        [from, to, tokenId, data],
        opts
      );
    };

    const safeTransferFromBytesToAccount = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(bignumberUtils.parseNumber(await token.balanceOf(accounts[0])), 2);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(bignumberUtils.parseString(await token.ownerOf(secondTokenId)), accounts[0]);
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            bignumberUtils.parseJSON(await token.tokensOf(accounts[0])),
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
            safeTransferFromTransaction(solidity.ZERO_ADDRESS, accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            safeTransferFromTransaction(accounts[1], solidity.ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            safeTransferFromTransaction(accounts[1], accounts[0], secondTokenId, {
              from: accounts[2]
            })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            safeTransferFromTransaction(accounts[1], accounts[0], secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            safeTransferFromTransaction(accounts[1], accounts[0], unknownTokenId, {
              from: accounts[1]
            })
          );
        });
      });
    };

    const safeTransferFromBytesToContract = function() {
      context('when successfull', function() {
        _clearApproval();
        _removeToken();

        it('increases the recepient balance', async function() {
          assert.equal(bignumberUtils.parseNumber(await token.balanceOf(receiver.address)), 1);
        });

        it('sets the token owner to recepient', async function() {
          assert.equal(
            bignumberUtils.parseString(await token.ownerOf(secondTokenId)),
            receiver.address
          );
        });

        it("adds token to the list of the recepient's owned tokens", async function() {
          assert.equal(
            bignumberUtils.parseJSON(await token.tokensOf(receiver.address)),
            '["' + secondTokenId.toString() + '"]'
          );
        });

        approvalEvent();

        it('emits a Transfer event', async function() {
          assert.equal(logs.length, 2);
          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args._from, accounts[1]);
          assert.equal(logs[1].args._to, receiver.address);
          assert.equal(logs[1].args._tokenId, secondTokenId);
        });
      });

      context('when zero address specified as token owner', function() {
        it('reverts', async function() {
          await assertRevert(
            safeTransferFromTransaction(solidity.ZERO_ADDRESS, receiver.address, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context('when zero address specified as token recepient', function() {
        it('reverts', async function() {
          await assertRevert(
            safeTransferFromTransaction(accounts[1], solidity.ZERO_ADDRESS, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when msg.sender isn't owner or approval of the specified token", function() {
        it('reverts', async function() {
          await assertRevert(
            safeTransferFromTransaction(accounts[1], receiver.address, secondTokenId, {
              from: accounts[2]
            })
          );
        });
      });

      context('when the specified token frozen', function() {
        it('reverts', async function() {
          await token.freeze(secondTokenId, { from: creator });
          await assertRevert(
            safeTransferFromTransaction(accounts[1], receiver.address, secondTokenId, {
              from: accounts[1]
            })
          );
        });
      });

      context("when the specified token doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(
            safeTransferFromTransaction(accounts[1], receiver.address, unknownTokenId, {
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
              safeTransferFromTransaction(accounts[1], receiver.address, secondTokenId, {
                from: accounts[1]
              })
            );
          });
        }
      );
    };

    describe('transferFrom', function() {
      context('transfer the token owned by msg.sender', function() {
        beforeEach('transfer a token', async function() {
          const result = await token.transferFrom(accounts[1], accounts[0], secondTokenId, {
            from: accounts[1]
          });
          logs = result.logs;
        });

        transferFrom();
      });

      context('transfer the token approved to msg.sender', function() {
        beforeEach('transfer a token', async function() {
          const result = await token.transferFrom(accounts[1], accounts[0], secondTokenId, {
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
            const result = await token.safeTransferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[1]
            });
            logs = result.logs;
          });

          safeTransferFromToAccount();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await token.safeTransferFrom(accounts[1], accounts[0], secondTokenId, {
              from: accounts[0]
            });
            logs = result.logs;
          });

          safeTransferFromToAccount();
        });
      });

      context('transfer the token to the smart contract', function() {
        context('transfer the token owned by msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await token.safeTransferFrom(
              accounts[1],
              receiver.address,
              secondTokenId,
              { from: accounts[1] }
            );
            logs = result.logs;
          });

          safeTransferFromToContract();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await token.safeTransferFrom(
              accounts[1],
              receiver.address,
              secondTokenId,
              { from: accounts[0] }
            );
            logs = result.logs;
          });

          safeTransferFromToContract();
        });
      });
    });

    // TODO: safeTransferFrom with additional bytes data
    describe('safeTransferFrom with additional bytes data', function() {
      context('transfer the token to the default account', function() {
        context('transfer the token owned by msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await safeTransferFromTransaction(
              accounts[1],
              accounts[0],
              secondTokenId,
              { from: accounts[1] }
            );
            logs = result.logs;
          });

          safeTransferFromBytesToAccount();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await safeTransferFromTransaction(
              accounts[1],
              accounts[0],
              secondTokenId,
              { from: accounts[0] }
            );
            logs = result.logs;
          });

          safeTransferFromBytesToAccount();
        });
      });

      context('transfer the token to the smart contract', function() {
        context('transfer the token owned by msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await safeTransferFromTransaction(
              accounts[1],
              receiver.address,
              secondTokenId,
              { from: accounts[1] }
            );
            logs = result.logs;
          });

          safeTransferFromBytesToContract();
        });

        context('transfer the token approved to msg.sender', function() {
          beforeEach('transfer a token', async function() {
            const result = await safeTransferFromTransaction(
              accounts[1],
              receiver.address,
              secondTokenId,
              { from: accounts[0] }
            );
            logs = result.logs;
          });

          safeTransferFromBytesToContract();
        });
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
      await token.setMinter(minter, { from: creator });
      let result = await token.mint(to, eventId, { from: minter });
      logs = result.logs;
    });

    context('when successful', function() {
      it('increases the total tokens amount', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.totalSupply()), 1);
      });

      it('assigns the token to the new owner', async function() {
        assert.equal(bignumberUtils.parseString(await token.ownerOf(tokenId)), to);
      });

      it('increases the balance of its owner', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.balanceOf(to)), 1);
      });

      it('assigns the token to the given event ID', async function() {
        assert.equal(bignumberUtils.parseNumber(await token.eventId(tokenId)), eventId);
      });

      it('adds the token to the list of the owned tokens', async function() {
        assert.equal(bignumberUtils.parseJSON(await token.tokensOf(to)), '["1"]');
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
        await assertRevert(token.mint(solidity.ZERO_ADDRESS, eventId, { from: minter }));
      });
    });

    context("when the msg.sender isn't minter", function() {
      it('reverts', async function() {
        await assertRevert(token.mint(to, eventId, { from: to }));
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
        assert.equal(bignumberUtils.parseString(await token.minter()), minter);
      });
    });

    context('when zero address given', function() {
      it('reverts', async function() {
        await assertRevert(token.setMinter(solidity.ZERO_ADDRESS, { from: creator }));
      });
    });
  });
});
