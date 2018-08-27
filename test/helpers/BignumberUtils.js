const parseNumber = val => val.toNumber();
const parseString = val => val.toString(10);
const parseJSON = val => JSON.stringify(val);
const parseObject = val => JSON.parse(parseJSON(val));

module.exports = {
  parseNumber,
  parseString,
  parseJSON,
  parseObject
};
