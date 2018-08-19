const jsSha3 = require('js-sha3');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const keccak256 = jsSha3.keccak_256;
const sha3 = jsSha3.sha3_256;

const bytes = (obj, val) => {
  val = parseInt(val);
  if (obj === 0) return '0x' + 'f' * (val * 2);
  obj = obj.toString();
  return '0x' + obj.slice(0, val * 2);
};

module.exports = {
  keccak256,
  sha3,
  ZERO_ADDRESS,
  bytes
};
