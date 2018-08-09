const jsSha3 = require('js-sha3');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES = '0xffffffffffffffffffffffffffffffffffffffff'
const keccak256 = jsSha3.keccak_256;
const sha3 = jsSha3.sha3_256;

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
