require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    main: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ropsten: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    kovan: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ganachecli: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    }
  }
};
