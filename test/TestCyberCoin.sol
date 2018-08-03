pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../contracts/CyberCoin.sol";

contract TestCyberCoin {

  function testInitialTokensAmount() public {
    CyberCoin cyber = new CyberCoin();
    uint expected = 0;
    Assert.equal(
      cyber.totalSupply(), 
      expected, 
      "Initial tokens amount should be equal to 0"
    );
  }

  function testMinterAddress() public {
    CyberCoin cyber = new CyberCoin();
    address expected = msg.sender;
    cyber.setMinter(expected);
    Assert.equal(
      cyber.minter(),
      expected,
      "Unexpected minter address"
    );
  }
	
}
