/**
 * @author the code is taken from OpenZeppelin Solidity
 * (https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/helpers/assertRevert.js)
 */

const assertRevert = async promise => {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
};

module.exports = assertRevert;
