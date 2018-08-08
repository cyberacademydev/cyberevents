
const hash = require('js-sha3');

const keccak256 = hash.keccak256;
const sha3 = hash.sha3_256;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES = '0xffffffff'

const bytes = (obj, val) => {
  obj = obj.toString();
  val = parseInt(val);
  return ('0x' + obj.slice(0, val * 2));
}

module.exports = {
  keccak256,
  sha3,
  ZERO_ADDRESS,
  ZERO_BYTES,
  bytes
};
