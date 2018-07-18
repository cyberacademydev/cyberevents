pragma solidity ^0.4.24;

/**
 * @title Contract that helps with getting ERC721 receive data
 * @author Nick (facebook.com/k.kornilov01)
 */
contract ReceiveData {
  /**
   * @dev Gets hash, that will be ERC721 token receiving magic value
   * @param _receiveData contains data, that will be transformed to 8 symbols hash
   * @return bytes4 receive magic value
   */
  function getReceiveData(string _receiveData) public pure returns (bytes4) {
    return bytes4(keccak256(_receiveData));
  }
}
