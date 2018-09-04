const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { parseNumber, parseString, parseJSON, parseObject } = require('./helpers/BignumberUtils');
const { increaseTime, duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { sendTransaction } = require('openzeppelin-solidity/test/helpers/sendTransaction');

const CyberCore = artifacts.require('CyberCore');

web3.eth.defaultAccount = web3.eth.accounts[0];

contract('CyberCore', function(accounts) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const TOKEN_DATA_STRING = 'test';
  const TOKEN_DATA_HASH = '0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658';
  const creator = accounts[0];

  let core;

  beforeEach('deploy new contracts for each test', async function() {
    this.core = await CyberCore.new({ from: creator });
  });

  describe('getEvent', function() {
    const eventId = 1;
    const unknownEventId = 2;

    let startTime;
    let endTime;
    let event;

    beforeEach('create an event', async function() {
      startTime = (await latestTime()) + duration.hours(1);
      endTime = (await latestTime()) + duration.hours(2);
      await this.core.createEvent(startTime, endTime, 0, 100, 25, 25, [accounts[0]], {
        from: creator
      });
    });

    describe('first', function() {
      beforeEach('call getEventFirst', async function() {
        event = await this.core.getEventFirst(eventId);
      });

      context('when successfull', function() {
        it('gets the specified event ID', async function() {
          assert.equal(parseNumber(event[0]), eventId);
        });

        it('gets the specified event start time', async function() {
          assert.equal(parseNumber(event[1]), startTime);
        });

        it('gets the specified event end time', async function() {
          assert.equal(parseNumber(event[2]), endTime);
        });

        it('gets the specified event ticket price', async function() {
          assert.equal(parseNumber(event[3]), 0);
        });

        it('gets the specified event tickets amount', async function() {
          assert.equal(parseNumber(event[4]), 100);
        });

        it('gets the specified event paid ETH amount', async function() {
          assert.equal(parseNumber(event[5]), 0);
        });
      });

      context("when the specified event doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(this.core.getEventFirst(unknownEventId));
        });
      });
    });

    describe('second', function() {
      beforeEach('call getEventFirst', async function() {
        event = await this.core.getEventSecond(eventId);
      });

      context('when successfull', function() {
        it('gets the specified event owner percent', async function() {
          assert.equal(parseNumber(event[0]), 25);
        });

        it('gets the specified event speakers percent', async function() {
          assert.equal(parseNumber(event[1]), 25);
        });

        it('gets the specified event participants list', async function() {
          assert.equal(parseJSON(event[2]), '[]');
        });

        it('gets the specified event speakers list', async function() {
          assert.equal(parseJSON(event[3]), '["' + accounts[0] + '"]');
        });

        it('gets the specified event canceled state', async function() {
          assert.equal(event[4], false);
        });
      });

      context("when the specified event doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(this.core.getEventFirst(unknownEventId));
        });
      });
    });
  });

  // TODO: getUpcomingEvents
  describe('getUpcomingEvents', function() {});

  describe('eventExists', function() {
    const eventId = 1;
    const unknownEventId = 2;

    beforeEach('create an event', async function() {
      await this.core.createEvent(
        (await latestTime()) + duration.hours(1),
        (await latestTime()) + duration.hours(2),
        0,
        100,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );
    });

    context('when the specified event exists', function() {
      it('returns true', async function() {
        assert.equal(await this.core.eventExists(eventId), true);
      });
    });

    context("when the specified event doesn't exist", function() {
      it('returns false', async function() {
        assert.equal(await this.core.eventExists(unknownEventId), false);
      });
    });
  });

  describe('participated', function() {
    const firstEventId = 1;
    const secondEventId = 2;
    const unknownEventId = 3;

    beforeEach('create an event and sign up to it', async function() {
      await this.core.createEvent(
        (await latestTime()) + duration.hours(1),
        (await latestTime()) + duration.hours(2),
        0,
        100,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );

      await this.core.createEvent(
        (await latestTime()) + duration.hours(1),
        (await latestTime()) + duration.hours(2),
        0,
        100,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );

      await this.core.signUp(firstEventId, TOKEN_DATA_HASH, { from: accounts[1], value: 721 });
    });

    context('when the specified account participated in the given event', function() {
      it('returns true', async function() {
        assert.equal(await this.core.participated(accounts[1], firstEventId), true);
      });
    });

    context("when the specified account didn't participate in the given event", function() {
      it('returns false', async function() {
        assert.equal(await this.core.participated(accounts[1], secondEventId), false);
      });
    });

    context('when the specified address is zero address', function() {
      it('reverts', async function() {
        assertRevert(this.core.participated(ZERO_ADDRESS, secondEventId));
      });
    });

    context("when the specified event doesn't exist", function() {
      it('reverts', async function() {
        assertRevert(this.core.participated(accounts[1], unknownEventId));
      });
    });
  });

  describe('createEvent', function() {
    const eventId = 1;

    let startTime;
    let endTime;
    let firstEvent;
    let secondEvent;
    let logs;

    beforeEach('create an event', async function() {
      startTime = (await latestTime()) + duration.hours(1);
      endTime = (await latestTime()) + duration.hours(2);
      const result = await this.core.createEvent(
        startTime,
        endTime,
        0,
        100,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );
      logs = result.logs;
      firstEvent = await this.core.getEventFirst(eventId);
      secondEvent = await this.core.getEventSecond(eventId);
    });

    context('when successfull', function() {
      it('sets the event ID to the current lastEvent value + 1', async function() {
        assert.equal(parseNumber(firstEvent[0]), eventId);
      });

      it('sets the event start time', async function() {
        assert.equal(parseNumber(firstEvent[1]), startTime);
      });

      it('sets the event end time', async function() {
        assert.equal(parseNumber(firstEvent[2]), endTime);
      });

      it('sets the event ticket price', async function() {
        assert.equal(parseNumber(firstEvent[3]), 0);
      });

      it('sets the event tickets amount', async function() {
        assert.equal(parseNumber(firstEvent[4]), 100);
      });

      it('sets the event paid ETH amount', async function() {
        assert.equal(parseNumber(firstEvent[5]), 0);
      });

      it('sets the event owner percent', async function() {
        assert.equal(parseNumber(secondEvent[0]), 25);
      });

      it('sets the event speakers percent', async function() {
        assert.equal(parseNumber(secondEvent[1]), 25);
      });

      it('sets the event participants array to empty array', async function() {
        assert.equal(parseJSON(secondEvent[2]), '[]');
      });

      it('sets the event speakers addresses array', async function() {
        assert.equal(parseJSON(secondEvent[3]), '["' + accounts[0] + '"]');
      });

      it('sets the event canceled state', async function() {
        assert.equal(secondEvent[4], false);
      });

      it('emits an EventCreated event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'EventCreated');
        assert.equal(logs[0].args.eventId, eventId);
      });
    });

    context('when the given start time is smaller or equal to the block.timestamp', function() {
      it('reverts', async function() {
        startTime = await latestTime();
        await assertRevert(
          this.core.createEvent(startTime, endTime, 0, 100, 25, 25, [accounts[0]], {
            from: creator
          })
        );
      });
    });

    context('when the given end time is smaller or equal to the event start time', function() {
      it('reverts', async function() {
        endTime = startTime;
        await assertRevert(
          this.core.createEvent(startTime, endTime, 0, 100, 25, 25, [accounts[0]], {
            from: creator
          })
        );
      });
    });

    context('when the given tickets amount equals to 0', function() {
      it('reverts', async function() {
        await assertRevert(
          this.core.createEvent(startTime, endTime, 0, 0, 25, 25, [accounts[0]], { from: creator })
        );
      });
    });

    context('when the given speakers array length equals to 0', function() {
      it('reverts', async function() {
        await assertRevert(
          this.core.createEvent(startTime, endTime, 0, 100, 25, 25, [], { from: creator })
        );
      });
    });

    context(
      'when the amount of the given speakers and owner percent is bigger than 100',
      function() {
        it('reverts', async function() {
          await assertRevert(
            this.core.createEvent(startTime, endTime, 0, 100, 100, 100, [accounts[0]], {
              from: creator
            })
          );
        });
      }
    );
  });

  describe('signUp', function() {
    const tokenId = 1;
    const eventId = 1;

    let logs;

    beforeEach('sign up', async function() {
      await this.core.createEvent(
        (await latestTime()) + duration.hours(1),
        (await latestTime()) + duration.hours(2),
        721,
        2,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );
      const result = await this.core.signUp(eventId, TOKEN_DATA_HASH, {
        from: accounts[1],
        value: 721
      });

      logs = result.logs;
    });

    context('when successfull', function() {
      it('mints a token', async function() {
        assert.equal(parseNumber(await this.core.totalSupply()), 1);
        assert.equal(parseString(await this.core.ownerOf(tokenId)), accounts[1]);
        assert.equal(parseNumber(await this.core.balanceOf(accounts[1])), 1);
        assert.equal(parseNumber(await this.core.tokenByIndex(0)), 1);
        assert.equal(parseJSON(await this.core.tokensOf(accounts[1])), '["1"]');
      });

      it('sets the minted token eventId to the specified event ID', async function() {
        assert.equal(parseNumber(await this.core.eventId(tokenId)), eventId);
      });

      it('sets the token data to the specified value', async function() {
        assert.equal(parseString(await this.core.getTokenData(tokenId)), TOKEN_DATA_HASH);
      });

      it('receives the ETH', async function() {
        assert.equal(web3.eth.getBalance(this.core.address), 721);
      });

      it('decreases the specified event tickets amount', async function() {
        assert.equal(parseNumber((await this.core.getEventFirst(eventId))[4]), 1);
      });

      it('increases the specified event paid ETH amount', async function() {
        assert.equal(parseNumber((await this.core.getEventFirst(eventId))[5]), 721);
      });

      it('adds msg.sender to the specified event participants array', async function() {
        assert.equal(
          parseJSON((await this.core.getEventSecond(eventId))[2]),
          '["' + accounts[1] + '"]'
        );
      });

      it('sets the msg.sender participation in the specified event to true', async function() {
        assert.equal(await this.core.participated(accounts[1], eventId), true);
      });

      it('emits a Mint event', async function() {
        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, 'Mint');
        assert.equal(logs[0].args.to, accounts[1]);
        assert.equal(parseNumber(logs[0].args.tokenId), tokenId);
      });

      it('emits a SignUp event', async function() {
        assert.equal(logs.length, 2);
        assert.equal(logs[1].event, 'SignUp');
        assert.equal(logs[1].args.participant, accounts[1]);
        assert.equal(logs[1].args.eventId, eventId);
      });
    });

    context('when the msg.value is bigger than the ticket price', function() {
      it('receives it', async function() {
        await this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[2], value: 777 });
        assert.equal(parseNumber(web3.eth.getBalance(this.core.address)), 721 + 777);
      });
    });

    context('when the block.timestamp is equal or bigger than the event start time', function() {
      it('reverts', async function() {
        await this.core.createEvent(
          (await latestTime()) + duration.seconds(5),
          (await latestTime()) + duration.seconds(10),
          721,
          1,
          25,
          25,
          [accounts[0]],
          { from: creator }
        );
        await increaseTime(duration.seconds(7));
        await assertRevert(this.core.signUp(2, TOKEN_DATA_HASH, { from: accounts[2], value: 721 }));
      });
    });

    context('when the tickets are already over', function() {
      it('reverts', async function() {
        await this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[2], value: 721 });
        await assertRevert(
          this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[3], value: 721 })
        );
      });
    });

    context('when the msg.value is smaller than the ticket price', function() {
      it('reverts', async function() {
        await assertRevert(
          this.core.signUp(eventId, TOKEN_DATA_HASH, {
            from: accounts[2],
            value: 20
          })
        );
      });
    });

    context('when the msg.sender is the contract owner', function() {
      it('reverts', async function() {
        await assertRevert(
          this.core.signUp(eventId, TOKEN_DATA_HASH, { from: creator, value: 721 })
        );
      });
    });

    context('when the msg.sender is already participate in the specified event', function() {
      it('reverts', async function() {
        await assertRevert(
          this.core.signUp(eventId, TOKEN_DATA_HASH, {
            from: accounts[1],
            value: 721
          })
        );
      });
    });

    context('when the specified event is canceled', function() {
      it('reverts', async function() {
        await this.core.cancelEvent(eventId, { from: creator });
        await assertRevert(
          this.core.signUp(eventId, TOKEN_DATA_HASH, {
            from: accounts[2],
            value: 721
          })
        );
      });
    });
  });

  describe('checkIn', function() {
    const tokenId = 1;
    const eventId = 1;

    let logs;

    beforeEach('check in', async function() {
      await this.core.createEvent(
        (await latestTime()) + duration.hours(1),
        (await latestTime()) + duration.hours(2),
        721,
        2,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );
      await this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[1], value: 777 });
      const result = await this.core.checkIn(tokenId, TOKEN_DATA_STRING, { from: creator });
      logs = result.logs;
    });

    context('when succesfull', function() {
      it('clears approoval of the specified token', async function() {
        assert.equal(parseString(await this.core.getApproved(tokenId)), ZERO_ADDRESS);
      });

      it('freezes the specified token', async function() {
        assert.equal(await this.core.tokenFrozen(tokenId), true);
      });

      it('emits an Approval event with zero address specified as spender', async function() {
        assert.equal(logs.length, 3);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, accounts[1]);
        assert.equal(logs[0].args._approved, ZERO_ADDRESS);
        assert.equal(parseNumber(logs[0].args._tokenId), tokenId);
      });

      it('emit a TokenFreeze event', async function() {
        assert.equal(logs.length, 3);
        assert.equal(logs[1].event, 'TokenFreeze');
        assert.equal(parseNumber(logs[1].args.tokenId), tokenId);
      });

      it('emits a CheckIn event', async function() {
        assert.equal(logs.length, 3);
        assert.equal(logs[2].event, 'CheckIn');
        assert.equal(logs[2].args.participant, accounts[1]);
        assert.equal(parseNumber(logs[2].args.eventId), eventId);
      });
    });

    context('when the specified string data incorrect', function() {
      it('reverts', async function() {
        await assertRevert(this.core.checkIn(tokenId, 'random', { from: creator }));
      });
    });

    context('when the specified token frozen', function() {
      it('reverts', async function() {
        await this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[2], value: 721 });
        await this.core.setMinter(creator, { from: creator });
        await this.core.freeze(2, { from: creator });
        await assertRevert(this.core.checkIn(2, TOKEN_DATA_STRING, { from: creator }));
      });
    });

    context('when the block.timestamp is equal or bigger than the event end time', function() {
      it('reverts', async function() {
        await this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[2], value: 721 });
        await increaseTime(duration.hours(3));
        await assertRevert(this.core.checkIn(2, TOKEN_DATA_STRING, { from: creator }));
      });
    });

    context('when the specified event is canceled', function() {
      it('reverts', async function() {
        await this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[2], value: 721 });
        await this.core.cancelEvent(eventId);
        await assertRevert(this.core.checkIn(2, TOKEN_DATA_STRING, { from: creator }));
      });
    });
  });

  describe('cancelEvent', function() {
    const eventId = 1;
    const unknownEventId = 2;

    let logs;

    beforeEach('cancel event', async function() {
      await this.core.createEvent(
        (await latestTime()) + duration.hours(1),
        (await latestTime()) + duration.hours(2),
        721,
        2,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );

      const result = await this.core.cancelEvent(eventId, { from: creator });
      logs = result.logs;
    });

    context('when successfull', function() {
      it('sets the specified event cancel state to true', async function() {
        assert.equal((await this.core.getEventSecond(eventId))[4], true);
      });
    });

    context('when the specified event is already canceled', function() {
      it('reverts', async function() {
        await assertRevert(this.core.cancelEvent(eventId, { from: creator }));
      });
    });

    context("when the specified event doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.core.cancelEvent(unknownEventId, { from: creator }));
      });
    });
  });

  describe('closeEvent', function() {
    const eventId = 1;
    const tokenId = 1;

    let logs;

    beforeEach('close event', async function() {
      await this.core.createEvent(
        (await latestTime()) + duration.hours(1),
        (await latestTime()) + duration.hours(2),
        721,
        2,
        25,
        25,
        [accounts[0]],
        { from: creator }
      );
      await this.core.signUp(eventId, TOKEN_DATA_HASH, { from: accounts[1], value: 777 });
      await this.core.checkIn(tokenId, TOKEN_DATA_STRING, { from: creator });
      await increaseTime(duration.hours(3));
      const result = await this.core.closeEvent(eventId);
      logs = result.logs;
    });

    context('when successfull', function() {
      it('emits an EventClosed event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'EventClosed');
        assert.equal(parseNumber(logs[0].args.eventId), eventId);
      });
    });
  });

  // TODO: fallback function test
  describe('fallback', function() {});
});
