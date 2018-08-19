require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    live: {
      provider: function() {
        return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/' + infura_apikey);
      },
      network_id: '1'
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/' + infura_apikey);
      },
      network_id: '3'
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(mnemonic, 'https://kovan.infura.io/' + infura_apikey);
      },
      network_id: '4'
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*'
    },
    ganachecli: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    }
  }
};
