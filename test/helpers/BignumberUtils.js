
const parseNumber = (bignumber) => {
  return bignumber.toNumber();
}

const parseString = (bignumber) => {
  return bignumber.toString();
}

const parseJSON = (bignumber) => {
  return JSON.stringify(bignumber);
}

const parseObject = (bignumber) => {
  return JSON.parse(parseJSON(bignumber));
}

module.exports = {
  parseNumber,
  parseString,
  parseJSON,
  parseObject
};
