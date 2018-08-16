pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Receiver.sol";


/**
 * @title Contract that can handle incoming token transfers
 * @author Nick (https://facebook.com/k.kornilov01)
 */
contract CyberReceiver is ERC721Receiver {

  function onERC721Received(
    address _operator,
    address _from,
    uint256 _tokenId,
    bytes _data
  )
    public
    returns (bytes4)
  {
    return ERC721_RECEIVED;
  }

}
