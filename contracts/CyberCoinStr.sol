pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Basic.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Contactable.sol";
import "../node_modules/openzeppelin-solidity/contracts/AddressUtils.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract CybeerCoin {

  using AddressUtils for address;
  using SafeMath for uint;

  string internal constant name_ = "CybeerCoin";
  string internal constant symbol_ = "CYBEER";

  uint[] allTokens;


  struct User {
    uint balance;
    uint[] ownedTokens;

  }

  mapping(address => uint) balances;
  mapping(address => uint[]) ownedTokens;

  struct Token {
    address owner;
    address approval;
    uint id;
    uint eventId;
    uint ownedTokensIndex;
    string uri;
    bool freeze;
  }

  mapping(uint => address) tokenOwner;
  mapping(uint => address) tokenApproval;
  mapping(uint => uint) tokenEvent;
  mapping(uint => uint) ownedTokensIndex;
  mapping(uint => uint) allTokensIndex;
  mapping(uint => string) tokenUri;
  mapping(uint => bool) freezedList;


  function name() public view returns (string) {
    return name_;
  }

  function symbol() public view returns (string) {
    return symbol_;
  }

  function tokenURI(uint _tokenId) public view returns (string) {

  }

  function balanceOf(address _owner) public view returns (uint) {

  }

  function ownerOf(uint _tokenId) public view returns (address) {

  }

  function exists(uint _tokenId) public view returns (bool) {
    
  }

  function approve(
    address _to, 
    uint _tokenId
  ) 
    public 
  {

  }

  function getApproved(uint _tokenId) public view returns (address) {

  }

  function setApprovalForAll(
    address _operator, 
    bool _approved
  ) 
    public 
  {

  }

  function isApprovedForAll(address _owner, address _operator)
    public view returns (bool);

  function transferFrom(
    address _from, 
    address _to, 
    uint _tokenId
  ) 
    public
  {

  }

  function safeTransferFrom(
    address _from, 
    address _to, 
    uint _tokenId
  )
    public
  {

  }

  function safeTransferFrom(
    address _from,
    address _to,
    uint _tokenId,
    bytes _data
  )
    public
  {

  }

  function totalSupply() public view returns (uint);
  function tokenOfOwnerByIndex(
    address _owner,
    uint _index
  )
    public
    view
    returns (uint _tokenId);

  function tokenByIndex(uint _index) public view returns (uint);


}