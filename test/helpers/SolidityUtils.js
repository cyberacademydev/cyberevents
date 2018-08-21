const jsSha3 = require('js-sha3');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const keccak256 = jsSha3.keccak_256;
const sha3 = jsSha3.sha3_256;

module.exports = {
  keccak256,
  sha3,
  ZERO_ADDRESS
};
