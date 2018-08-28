![cyber_academy_01](https://camo.githubusercontent.com/570941ccc5af616edbe376dcfd8d75978223b261/68747470733a2f2f63646e2e65766275632e636f6d2f6576656e746c6f676f732f3235363732393335332f796f75747562652e706e67)

# Cyber Academy DApp

We’re going to realize an automated event organization blockchain platform. Our solution is a DApp, where participants can sign up, get their tickets and easily check in on the event. All these operations occur in the network of smart contracts and the entrance tickets are ERC721 tokens

# Test

If you want to run tests you need next dependencies

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org)
- [npm](https://www.npmjs.com/get-npm)
- [Truffle](https://truffleframework.com/)
- [Ganache](https://truffleframework.com/ganache) or [ganache-cli](https://github.com/trufflesuite/ganache-cli) (Ganache recommended)

Clone this repository

```
$ git clone https://github.com/cyberevents/cyber-academy-dapp
```

> _Make sure, that you run all next commands in the repository root_

You need to install project's node dependencies

```
$ npm install
```

To run all tests

```
$ truffle test --network-<testrpc> // <testrpc> : testrpc you're running (eg --network-ganache, in the truffle.js you can find all networks names)
```

To run the specified test

```
$ truffle test <test> --network-ganache // <test> : path to the test file you're going to run (eg ./test/TestCyberCoin.test.js)
```


# License

Licensed under the [MIT license](https://github.com/cyberevents/cyber-academy-dapp/edit/master/LICENSE), copyright (c) 2018 [Cyber Academy](https://github.com/cyberevents)
