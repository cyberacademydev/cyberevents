pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Receiver.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Cyberevents ERC721 modified token
 * @author Kolya Kornilov
 */
contract Ticket is ERC721, Contactable {
  using AddressUtils for address;
  using SafeMath for uint;

  string internal constant name_ = "TICKET";
  string internal constant symbol_ = "TICKET";

  bytes4 internal constant ERC721_RECEIVED = 0x150b7a02;
  bytes4 internal constant InterfaceId_ERC165 = 0x01ffc9a7;
  bytes4 internal constant InterfaceId_ERC721TokensOf = 0x5a3f2672;

  uint internal totalSupply_;
  uint[] internal allTokens;
  address public minter;

  mapping (address => uint) internal balances;
  mapping (address => uint[]) internal ownedTokens;
  mapping (address => mapping (address => bool)) internal approvedForAll;
  mapping (uint => address) internal tokenOwner;
  mapping (uint => uint) internal ownedTokensIndex;
  mapping (uint => address) internal tokenApproval;
  mapping (uint => uint) internal allTokensIndex;
  mapping (uint => bool) internal freezedTokens;
  mapping (uint => uint) internal tokenEventId;
  mapping (uint => bytes32) internal tokenData;
  mapping (uint => string) internal tokenURIs;
  mapping (bytes4 => bool) internal supportedInterfaces;

  event Burn(address indexed from, uint tokenId);
  event TokenFreeze(uint tokenId);
  event Mint(address indexed to, uint tokenId);

  /**
   * @dev Throws if the `msg.sender` doesn't own the specified token
   * @param _tokenId uint the validated token ID
   */
  modifier onlyOwnerOf(uint _tokenId) {
    require(msg.sender == ownerOf(_tokenId));
    _;
  }

  /**
   * @dev Throws if the `msg.sender` cannot transfer the specified token
   * @param _tokenId uint the validated token ID
   */
  modifier canTransfer(address _to, uint _tokenId) {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    require(!tokenFrozen(_tokenId));
    require(exists(_tokenId));
    require(_to != address(0));
    _;
  }

  /**
   * @dev Throws if the specified token frozen
   * @param _tokenId uint the validated token ID
   */
  modifier checkFreeze(uint _tokenId) {
    require(!tokenFrozen(_tokenId));
    _;
  }

  /**
   * @dev Throws if the `msg.sender` isn't the minter
   */
  modifier onlyMinter() {
    require(msg.sender == minter);
    _;
  }

  /**
   * @dev Constructor that registers implemented interfaces
   */
  constructor() public {
    _registerInterface(InterfaceId_ERC165);
    _registerInterface(InterfaceId_ERC721);
    _registerInterface(InterfaceId_ERC721Exists);
    _registerInterface(InterfaceId_ERC721Enumerable);
    _registerInterface(InterfaceId_ERC721Metadata);
    _registerInterface(InterfaceId_ERC721TokensOf);
  }

  /**
   * @dev Gets the token name
   * @return string the token name
   */
  function name() external view returns (string) {
    return name_;
  }

  /**
   * @dev Gets the token symbol
   * @return string the token symbol
   */
  function symbol() external view returns (string) {
    return symbol_;
  }

  /**
   * @dev Gets the total tokens amount
   * @return uint the total tokens value
   */
  function totalSupply() public view returns (uint) {
    return totalSupply_;
  }

  /**
   * @dev Gets the given account tokens balance
   * @param _owner address the tokens owner which balance need to return
   * @return uint the current given address owned tokens amount
   */
  function balanceOf(address _owner) public view returns (uint) {
    require(_owner != address(0));
    return balances[_owner];
  }

  /**
   * @dev Gets the token owner by its ID
   * @param _tokenId uint ID of the token the owner of wich need to find
   * @return address the `_tokenId` owner
   */
  function ownerOf(uint _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenOwner[_tokenId];
  }

  /**
   * @dev Gets the list of the given address owned tokens
   * @param _owner address the tokens owner
   * @return uint[] the list of the specified address owned tokens
   */
  function tokensOf(address _owner) public view returns (uint[]) {
    require(_owner != address(0));
    return ownedTokens[_owner];
  }

  /**
   * @dev Gets the token ID by its owner address and the `ownedTokens`
   * @dev list position
   * @param _owner address the token owner
   * @param _index uint the `ownedTokens` array posotion
   * @return uint the seeking token ID
   */
  function tokenOfOwnerByIndex(address _owner, uint _index)
    public
    view
    returns (uint)
  {
    require(_owner != address(0));
    require(ownedTokens[_owner].length > _index);
    return ownedTokens[_owner][_index];
  }

  /**
   * @dev Gets the token by its `allTokens` array index
   * @param _index uint the `allTokens` array position
   * @return uint the seeking token ID
   */
  function tokenByIndex(uint _index) public view returns (uint) {
    require(allTokens.length > _index);
    return allTokens[_index];
  }

  /**
   * @dev Gets the token approval
   * @param _tokenId uint the specified token ID
   * @return address the `_tokenId` approval
   */
  function getApproved(uint _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenApproval[_tokenId];
  }

  /**
   * @dev Gets the address allowed to spend all the `_owner` tokens
   * @param _owner address the tokens owner
   * @param _spender address the validated account
   * @return bool the approved for all tokens state
   */
  function isApprovedForAll(address _owner, address _spender)
    public
    view
    returns (bool)
  {
    require(_owner != address(0));
    require(_spender != address(0));
    return approvedForAll[_owner][_spender];
  }

  /**
   * @dev Function to check that the given account is allowed to spend the
   * @dev specified token
   * @param _spender address the validated account
   * @param _tokenId uint ID of the specified token
   * @return bool the validation result
   */
  function isApprovedOrOwner(address _spender, uint _tokenId)
    public
    view
    returns (bool)
  {
    require(_spender != address(0));
    require(exists(_tokenId));

    address owner = ownerOf(_tokenId);
    return (
      _spender == owner ||
      getApproved(_tokenId) == _spender ||
      isApprovedForAll(owner, _spender)
    );
  }

  /**
   * @dev Function to check the existence of the token
   * @param _tokenId uint ID of the validated token
   * @return bool the token existence
   */
  function exists(uint _tokenId) public view returns (bool) {
    return tokenOwner[_tokenId] != address(0);
  }

  /**
   * @dev Gets the token freeze state
   * @param _tokenId uint ID of the validated token
   * @return bool the `_tokenId` freeze state
   */
  function tokenFrozen(uint _tokenId) public view returns (bool) {
    require(exists(_tokenId));
    return freezedTokens[_tokenId];
  }

  /**
   * @dev Gets the given token event ID
   * @param _tokenId uint ID of the specified token
   * @return uint `_tokenId` event ID
   */
  function eventId(uint _tokenId) public view returns (uint) {
    require(exists(_tokenId));
    return tokenEventId[_tokenId];
  }

  /**
   * @dev Gets the specified token data
   * @param _tokenId uint ID of the specified token
   * @return bytes32 `_tokenId` data
   */
  function getTokenData(uint _tokenId) public view returns (bytes32) {
    require(exists(_tokenId));
    return tokenData[_tokenId];
  }

  /**
   * @dev Gets the specified token URI
   * @param _tokenId uint the specified token ID
   * @return string the `_tokenId` URI
   */
  function tokenURI(uint _tokenId) public view returns (string) {
    require(exists(_tokenId));
    return tokenURIs[_tokenId];
  }

  /**
   * @dev Gets the inteface support state by its ID
   * @param _eventId bytes4 validated interface ID
   * @return bool `true` if supports
   */
  function supportsInterface(bytes4 _eventId) external view returns (bool) {
    require(_eventId != 0xffffffff);
    return supportedInterfaces[_eventId];
  }

  /**
   * @dev Function to approve an account to spend the specified token
   * @param _spender address the token spender
   * @param _tokenId uint ID of the token to be approved
   */
  function approve(address _spender, uint _tokenId)
    public
    onlyOwnerOf(_tokenId)
    checkFreeze(_tokenId)
  {
    require(_spender != address(0));
    require(_spender != ownerOf(_tokenId));
    tokenApproval[_tokenId] = _spender;
    emit Approval(msg.sender, _spender, _tokenId);
  }

  /**
   * @dev Function to set an approval for all owned tokens
   * @param _spender address the tokens spender
   * @param _approve bool approval
   */
  function setApprovalForAll(address _spender, bool _approve) public {
    require(_spender != address(0));
    approvedForAll[msg.sender][_spender] = _approve;
    emit ApprovalForAll(msg.sender, _spender, _approve);
  }

  /**
   * @dev Function to clear approval from the owned token
   * @param _tokenId uint spending token ID
   */
  function clearApproval(uint _tokenId)
    public
    onlyOwnerOf(_tokenId)
    checkFreeze(_tokenId)
  {
    _clearApproval(_tokenId);
  }

  /**
   * @dev Method to transfer token from the `msg.sender` balance or from the
   * @dev account that approved `msg.sender` to spend it
   * @param _from the token owner (address)
   * @param _to the token recepient (address)
   * @param _tokenId sending token ID (uint)
   */
  function transferFrom(
    address _from,
    address _to,
    uint _tokenId
  )
    public
    canTransfer(_to, _tokenId)
  {
    _clearApproval(_tokenId);
    _removeToken(_tokenId);
    _addTokenTo(_to, _tokenId);

    emit Transfer(_from, _to, _tokenId);
  }

  /**
   * @dev Function to transfer token with onERC721Received() call if the
   * @dev token recipient is the smart contract
   * @param _from address the token owner
   * @param _to address the token recepient
   * @param _tokenId uint sending token ID
   */
  function safeTransferFrom(address _from, address _to, uint _tokenId) public {
    safeTransferFrom(_from, _to, _tokenId, "");
  }

  /**
   * @dev Safe transfer function with additional transaction metadata
   * @param _from address the token owner
   * @param _to address the token recepient
   * @param _tokenId uint sending token ID
   * @param _data bytes metadata
   */
  function safeTransferFrom(
    address _from,
    address _to,
    uint _tokenId,
    bytes _data
  )
    public
    canTransfer(_to, _tokenId)
  {
    _clearApproval(_tokenId);
    _removeToken(_tokenId);
    _addTokenTo(_to, _tokenId);
    require(_safeContract(msg.sender, _from, _to, _tokenId, _data));

    emit Transfer(_from, _to, _tokenId);
  }

  /**
   * @dev Function to create a token and send it to the specified account
   * @param _to address the token recepient
   * @param _eventId uint ID of the event for wich the token will be minted
   * @param _data bytes32 value will be used in the `checkIn` function
   */
  function mint(address _to, uint _eventId, bytes32 _data) public onlyMinter {
    require(_mint(_to, _eventId, _data, ""));
  }

  /**
   * @dev Function mint a token with the specified URI
   * @param _to address the token recepient
   * @param _eventId uint ID of the event for wich the token will be minted
   * @param _data bytes32 value will be used in the `checkIn` function
   * @param _uri string the token URI
   */
  function mintWithURI(
    address _to, 
    uint _eventId, 
    bytes32 _data, 
    string _uri
  )
    public
    onlyMinter
  {
    require(_mint(_to, _eventId, _data, _uri));
  }

  /**
   * @dev Function to set an account that can mint tokens
   * @param _minter address the minter contract
   */
  function setMinter(address _minter) public onlyOwner {
    require(_minter != address(0));
    minter = _minter;
  }

  /**
   * @dev Function to freeze the specified token. After the token was frozen
   * @dev the token owner cannot transfer or approve this token
   * @param _tokenId uint ID of token to be frozen
   */
  function freeze(uint _tokenId) public onlyMinter {
    _freeze(_tokenId);
  }

  /**
   * @dev Internal function to add token to an account
   * @param _to address the token recepient
   * @param _tokenId uint sending tokens ID
   */
  function _addTokenTo(address _to, uint _tokenId) internal {
    tokenOwner[_tokenId] = _to;
    balances[_to] =  balances[_to].add(1);
    ownedTokensIndex[_tokenId] = ownedTokens[_to].length;
    ownedTokens[_to].push(_tokenId);
  }

  /**
   * @dev Internal function to remove token from the account
   * @param _tokenId uint owned token ID
   */
  function _removeToken(uint _tokenId) internal {
    uint lastToken = (
      ownedTokens[ownerOf(_tokenId)]
      [ownedTokens[ownerOf(_tokenId)].length.sub(1)]
    );
    balances[ownerOf(_tokenId)] = balances[ownerOf(_tokenId)].sub(1);
    ownedTokens[ownerOf(_tokenId)][ownedTokensIndex[_tokenId]] = lastToken;
    ownedTokens[ownerOf(_tokenId)][ownedTokensIndex[lastToken]] = 0;
    ownedTokens[ownerOf(_tokenId)].length = (
      ownedTokens[ownerOf(_tokenId)].length.sub(1)
    );
    tokenOwner[_tokenId] = address(0);
    ownedTokensIndex[lastToken] = ownedTokensIndex[_tokenId];
    ownedTokensIndex[_tokenId] = 0;
  }

  /**
   * @dev Internal function to clear approvals from the token
   * @param _tokenId uint approved token ID
   */
  function _clearApproval(uint _tokenId) internal {
    tokenApproval[_tokenId] = address(0);
    emit Approval(ownerOf(_tokenId), address(0), _tokenId);
  }

  /**
   * @dev Internal function to call `onERC721Received` `ERC721Receiver`
   * @dev interface function `safeTransferFrom` if the token recepient
   * @dev is the smart contract
   * @param _from address the token owner
   * @param _to address the token recepient
   * @param _tokenId uint sending token ID
   * @param _data bytes transaction metadata
   */
  function _safeContract(
    address _operator,
    address _from,
    address _to,
    uint _tokenId,
    bytes _data
  )
    internal
    returns (bool)
  {
    if (_to.isContract()) {
      ERC721Receiver receiver = ERC721Receiver(_to);
      require(ERC721_RECEIVED == receiver.onERC721Received(
        _operator,
        _from,
        _tokenId,
        _data
      ));
    }

    return true;
  }

  /**
   * @dev Internal function to create tokens
   * @param _to address the token recepient
   * @param _eventId uint ID of the event for wich the token will be minted
   * @param _data bytes32 value will be used in the `checkIn` function
   * @param _uri string the token URI
   */
  function _mint(
    address _to, 
    uint _eventId, 
    bytes32 _data, 
    string _uri
  )
    internal
    returns (bool)
  {
    require(_to != address(0));
    require(_eventId > 0);

    totalSupply_ = totalSupply_.add(1);
    uint tokenId = totalSupply_;
    allTokensIndex[tokenId] = allTokens.length;
    allTokens.push(tokenId);
    tokenEventId[tokenId] = _eventId;
    tokenData[tokenId] = _data;
    _addTokenTo(_to, tokenId);
    _setTokenURI(tokenId, _uri);

    emit Mint(_to, tokenId);
    return true;
  }

  /**
   * @dev Internal function to freeze a token
   * @param _tokenId uint ID of token to be frozen
   */
  function _freeze(uint _tokenId) internal {
    require(!tokenFrozen(_tokenId));
    freezedTokens[_tokenId] = true;
    _clearApproval(_tokenId);
    emit TokenFreeze(_tokenId);
  }

  /**
   * @dev Function to set token URI
   * @param _tokenId uint the token ID
   * @param _uri string the token URI that will be set
   */
  function _setTokenURI(uint _tokenId, string _uri) internal {
    require(exists(_tokenId));
    tokenURIs[_tokenId] = _uri;
  }

  /**
   * @dev Internal function to register support of an interface
   * @param _interfaceId bytes4 ID of the interface to be registered
   */
  function _registerInterface(bytes4 _interfaceId) internal {
    require(_interfaceId != 0xffffffff);
    supportedInterfaces[_interfaceId] = true;
  }

}
