const readline = require('readline-sync');
const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = readline.question('Enter your 12 word mnemonic\n');

module.exports = {
  networks: {
    live: {
      provider: () => new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/'),
      network_id: '1'
    },
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*'
    },
    main: {
      provider: () => new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/'),
      network_id: '1'
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/'),
      network_id: '3'
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/'),
      network_id: '4'
    },
    kovan: {
      provider: () => new HDWalletProvider(mnemonic, 'https://kovan.infura.io/'),
      network_id: '42'
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
