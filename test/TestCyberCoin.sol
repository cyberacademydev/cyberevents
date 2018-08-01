pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/CyberCoin.sol";

contract TestCyberCoin {

  function testERC721ReceivedDeployed() public {
    CyberCoin cyber = CyberCoin(DeployedAddresses.CyberCoin());
    bytes4 expected = 0x40253ed2;
    Assert.equal(
      cyber.ERC721_RECEIVED(),
      expected,
      "ERC721_RECEIVED magic value should be equal to 0xf4945cc6"
    );
  }

  function testERC721ReceivedNew() public {
    CyberCoin cyber = new CyberCoin();
    bytes4 expected = 0x40253ed2;
    Assert.equal(
      cyber.ERC721_RECEIVED(),
      expected,
      "ERC721_RECEIVED magic value should be equal to 0xf4945cc6"
    );
  }

  function testInitialTotalSupplyDeployed() public {
    CyberCoin cyber = CyberCoin(DeployedAddresses.CyberCoin());
    uint expected = 0;
    Assert.equal(
      cyber.totalSupply(), 
      expected, 
      "Initial tokens amount should be equal to 0"
    );
  }

  function testInitialTotalSupplyNew() public {
    CyberCoin cyber = new CyberCoin();
    uint expected = 0;
    Assert.equal(
      cyber.totalSupply(), 
      expected, 
      "Initial tokens amount should be equal to 0"
    );
  }
	
}
