pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Receiver.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title CybeerCoin ERC721 implementation
 * @author Nick (facebook.com/k.kornilov01)
 * @notice Project's GitHub: github.com/rjkz808/CyBeer
 */
contract CyberCoin is ERC721, Contactable {

  using AddressUtils for address;
  using SafeMath for uint;

  string internal constant name_ = "CyberCoin";
  string internal constant symbol_ = "CYBER";
  bytes4 internal constant receive_ = 0xf4945cc6;
  uint internal totalSupply_;
  uint[] internal allTokens;
  address public minter;

  mapping(address => uint) internal balances;
  mapping(address => uint[]) internal ownedTokens;
  mapping(address => mapping(address => bool)) internal approvedForAll;
  mapping(address => bool) internal freezedList;
  mapping(uint => address) internal tokenOwner;
  mapping(uint => uint) internal ownedTokensIndex;
  mapping(uint => address) internal tokenApproval;
  mapping(uint => uint) internal allTokensIndex;
  mapping(uint => bool) internal freezedTokens;
  mapping(uint => uint) internal tokenEventId;
  mapping(uint => string) internal tokenURIs;

  event Burn(address indexed from, uint tokenId);
  event TokenFreeze(uint tokenId);
  event Freeze(address indexed who);
  event Unfreeze(address indexed who);
  event Mint(address indexed to, uint tokenId);

  /**
   * @dev Throws if msg.sender isn't owner of that token
   * @param _tokenId validated token ID (uint)
   */
  modifier onlyOwnerOf(uint _tokenId) {
    require(msg.sender == ownerOf(_tokenId));
    _;
  }

  /**
   * @dev Throws if msg.sender cannot transfer that token
   * @param _tokenId validated token ID
   */
  modifier canTransfer(uint _tokenId) {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    require(!tokenFreezed(_tokenId));
    require(!isFreezed(ownerOf(_tokenId)));
    require(!isFreezed(msg.sender));
    _;
  }

  /**
   * @dev Throws if msg.sender's account freezed
   */
  modifier checkFreeze() {
    require(!isFreezed(msg.sender));
    _;
  }

  /**
   * @dev Throws if that token freezed
   * @param _tokenId validated token ID
   */
  modifier checkToken(uint _tokenId) {
    require(!tokenFreezed(_tokenId));
    _;
  }

  /**
   * @dev Throws if msg.sender isn't minter contract address
   */
  modifier onlyMinter() {
    require(msg.sender == minter);
    _;
  }

  /**
   * @dev Gets token name
   * @return string token name
   */
  function name() public view returns (string) {
    return name_;
  }

  /**
   * @dev Gets token symbol
   * @return string token symbol
   */
  function symbol() public view returns (string) {
    return symbol_;
  }

  /**
   * @dev Gets token receive magic value
   * @return bytes4 receive_
   */
  function receive() public view returns (bytes4) {
    return receive_;
  }

  /**
   * @dev Gets total tokens amount
   * @return uint total tokens supply
   */
  function totalSupply() public view returns (uint) {
    return totalSupply_;
  }

  /**
   * @dev Gets any account tokens balance
   * @param _owner tokens owner (address)
   * @return uint _owner tokens balance
   */
  function balanceOf(address _owner) public view returns (uint) {
    require(_owner != address(0));
    return balances[_owner];
  }

  /**
   * @dev Gets token owner by its ID
   * @param _tokenId token ID (uint)
   * @return address _tokenId owner
   */
  function ownerOf(uint _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenOwner[_tokenId];
  }

  /**
   * @dev Gets token ID by its allTokens array index
   * @param _index token's allTokens array index (uint)
   * @return uint token ID
   */
  function tokenByIndex(uint _index) public view returns (uint) {
    require(allTokens.length > _index);
    return allTokens[_index];
  }

  /**
   * @dev Gets any account owned tokens
   * @param _owner tokens owner (address)
   * @return uint[] array of _owner owned tokens
   */
  function tokensOf(address _owner) public view returns (uint[]) {
    require(_owner != address(0));
    return ownedTokens[_owner];
  }

  /**
   * @dev Gets token ID by its owner address and ownedTokens array index
   * @param _owner token owner (address)
   * @param _index token allTokens array index (uint)
   * @return uint token ID
   */
  function tokenOfOwnerByIndex(
    address _owner, 
    uint _index
  ) 
    public 
    view 
    returns (uint) 
  {
    require(_owner != address(0));
    require(ownedTokens[_owner].length > _index);
    return ownedTokens[_owner][_index];
  }

  /**
   * @dev Gets token approved address
   * @param _tokenId token ID (uint)
   * @return address _tokenId approved address
   */
  function getApproved(uint _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenApproval[_tokenId];
  }

  /**
   * @dev Gets status ofall tokens approved address of any tokens owner
   * @param _owner tokens owner (address)
   * @param _spender tokens spender(address)
   * @return bool approved for all tokens status
   */
  function isApprovedForAll(
    address _owner, 
    address _spender
  ) 
    public 
    view 
    returns (bool) 
  {
    require(_owner != address(0));
    require(_spender != address(0));
    return approvedForAll[_owner][_spender];
  }

  /**
   * @dev Method to check if _spender address is _tokenId token owner or spender
   * @param _spender validated token spender (address)
   * @param _tokenId validated token ID (uint)
   * @return bool validation status
   */
  function isApprovedOrOwner(
    address _spender, 
    uint _tokenId
  ) 
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
   * @dev Method to check existence of token
   * @param _tokenId validated token ID (uint)
   * @return bool token existence status
   */
  function exists(uint _tokenId) public view returns (bool) {
    return tokenOwner[_tokenId] != address(0);
  }

  /**
   * @dev Gets token freeze status
   * @param _tokenId validated token ID (uint)
   * @return bool token freeze status
   */
  function tokenFreezed(uint _tokenId) public view returns (bool) {
    require(exists(_tokenId));
    return freezedTokens[_tokenId];
  }

  /**
   * @dev Gets account freeze status
   * @param _who validated account (address)
   * @return bool _who freeze status
   */
  function isFreezed(address _who) public view returns (bool) {
    require(_who != address(0));
    return freezedList[_who];
  }

  /**
   * @dev Gets token event ID, needed for checkin
   * @param _tokenId token ID (uint)
   * @return uint event ID
   */
  function eventId(uint _tokenId) public view returns (uint) {
    require(exists(_tokenId));
    return tokenEventId[_tokenId];
  }

  /**
   * @dev Gets any token URI
   * @param _tokenId token ID (uint)
   * @return string _tokenId URI
   */
  function tokenURI(uint _tokenId) public view returns (string) {
    require(exists(_tokenId));
    return tokenURIs[_tokenId];
  }

  /**
   * @dev Method to transfer tokens
   * @param _from token owner (address)
   * @param _to token recepient (address)
   * @param _tokenId sending token ID (uint)
   */
  function transferFrom(
    address _from, 
    address _to, 
    uint _tokenId
  ) 
    public 
    canTransfer(_tokenId)
  {
    require(_from != address(0));
    require(_to != address(0));
    require(!isFreezed(_to));

    _clearApproval(_tokenId);
    removeToken(_tokenId);
    addTokenTo(_to, _tokenId);

    emit Transfer(_from, _to, _tokenId);
  }

  /**
   * @dev Safe method to transfer tokens
   * @param _from token sender (address)
   * @param _to token recepient (address)
   * @param _tokenId sending token ID (uint)
   */
  function safeTransferFrom(
    address _from, 
    address _to, 
    uint _tokenId
  ) 
    public 
  {
    bytes memory empty;
    safeTransferFrom(_from, _to, _tokenId, empty);
  }

  /**
   * @dev Safe method to transfer tokens with metadata
   * @param _from token sender (address)
   * @param _to token recepient (address)
   * @param _tokenId sending token ID (uint)
   * @param _data metadata (bytes)
   */
  function safeTransferFrom(
    address _from, 
    address _to,
    uint _tokenId, 
    bytes _data
  ) 
    public  
    canTransfer(_tokenId)
  {
    require(_from != address(0));
    require(_to != address(0));
    require(!isFreezed(_to));
    
    _clearApproval(_tokenId);
    removeToken(_tokenId);
    addTokenTo(_to, _tokenId);
    require(safeContract(_from, _to, _tokenId, _data));

    emit Transfer(_from, _to, _tokenId);
  }

  /**
   * @dev Internal method to call onERC721Received method 
   * @dev if tokens recepient is contract
   * @param _from token sender (address)
   * @param _to token recepient (address)
   * @param _tokenId sending token ID (uint)
   * @param _data metadata (bytes)
   */
  function safeContract(
    address _from, 
    address _to, 
    uint _tokenId, 
    bytes _data
  ) 
    internal 
    returns (bool)
  {
    if(!_to.isContract()) {
      ERC721Receiver receiver = ERC721Receiver(_to);
      require(receive_ == receiver.onERC721Received(_from, _tokenId, _data));
    }
    return true;
  }

  /**
   * @dev Method to approve tokens
   * @param _spender token spender (address)
   * @param _tokenId spending token ID (uint)
   */
  function approve(
    address _spender, 
    uint _tokenId
  ) 
    public 
    onlyOwnerOf(_tokenId)
    checkToken(_tokenId)
    checkFreeze
  {
    require(_spender != ownerOf(_tokenId));
    require(_spender != address(0));
    require(!isFreezed(_spender));
    tokenApproval[_tokenId] = _spender;
    emit Approval(msg.sender, _spender, _tokenId);
  }

  /**
   * @dev Method to set approval for all owned tokens
   * @param _spender tokens spender (address)
   * @param _approve tokens approval status (bool)
   */
  function setApprovalForAll(
    address _spender, 
    bool _approve
  ) 
    public 
    checkFreeze
  {
    require(_spender != address(0));
    require(!isFreezed(_spender));
    approvedForAll[msg.sender][_spender] = _approve;
  }

  /**
   * @dev Method to clear approvals from owned token
   * @param _tokenId spending token ID (uint)
   */
  function clearApproval(
    uint _tokenId
  ) 
    public 
    onlyOwnerOf(_tokenId) 
    checkFreeze
  {
    _clearApproval(_tokenId);
  }

  /**
   * @dev Internal method to clear approvals from token
   * @param _tokenId spenging token ID (uint)
   */
  function _clearApproval(
    uint _tokenId
  ) 
    internal 
  {
    tokenApproval[_tokenId] = address(0);
    emit Approval(ownerOf(_tokenId), address(0), _tokenId);
  }

  /**
   * @dev Internal method to add token to account
   * @param _to token recepient (address)
   * @param _tokenId sending token ID (uint)
   */
  function addTokenTo(
    address _to, 
    uint _tokenId
  ) 
    internal 
  {
    require(ownerOf(_tokenId) == address(0));
    tokenOwner[_tokenId] = _to;
    balances[_to] = balances[_to].add(1);
    ownedTokensIndex[_tokenId] = ownedTokens[_to].length;
    ownedTokens[_to].push(_tokenId);
  }

  /**
   * @dev Internal method to remove token from account
   * @param _tokenId owned token ID (uint)
   */
  function removeToken(
    uint _tokenId
  ) 
    internal 
  {
    address owner_ = ownerOf(_tokenId);
    tokenOwner[_tokenId] = address(0);
    balances[owner_] = balances[owner_].sub(1);

    uint tokenIndex = ownedTokensIndex[_tokenId];
    uint lastTokenIndex = ownedTokens[owner_].length.sub(1);
    uint lastToken = ownedTokens[owner_][lastTokenIndex];
    
    ownedTokens[owner_][tokenIndex] = lastToken;
    ownedTokens[owner_][lastTokenIndex] = 0;
    ownedTokens[owner_].length = ownedTokens[owner_].length.sub(1);
    ownedTokensIndex[_tokenId] = 0;
    ownedTokensIndex[lastToken] = tokenIndex;
  }

  /**
   * @dev Method to set token URI
   * @param _tokenId token ID (uint)
   * @param _uri token URI (string)
   */
  function setTokenURI(
    uint _tokenId, 
    string _uri
  ) 
    internal 
  {
    require(exists(_tokenId));
    tokenURIs[_tokenId] = _uri;
  }

  /**
   * @dev Method to burn token
   * @param _tokenId token ID (uint)
   */
  function burn(uint _tokenId) public {
    _burn(msg.sender, _tokenId);
  }

  /**
   * @dev Method to burn token from any account approved msg.sender
   * @param _owner token owner (address)
   * @param _tokenId token ID (uint)
   */
  function burnFrom(
    address _owner,
    uint _tokenId
  ) 
    public 
  {
    _burn(_owner, _tokenId);
  }

  /**
   * @dev Method to burn tokens
   * @param _tokenIds array with token IDs (uint[])
   */
  function burnTokens(uint[] _tokenIds) public {
    require(_tokenIds.length > 0);
    for(uint i = 0; i < _tokenIds.length; i++) {
      _burn(ownerOf(_tokenIds[i]), _tokenIds[i]);
    }
  }

  /**
   * @dev Internal method to burn token
   * @param _from token owner (address)
   * @param _tokenId token ID (uint)
   */
  function _burn(
    address _from,
    uint _tokenId
  ) 
    internal 
    canTransfer(_tokenId)
    checkFreeze
  {
    require(_from != address(0));
    require(!isFreezed(_from));

    totalSupply_ = totalSupply_.sub(1);
    removeToken(_tokenId);
    _clearApproval(_tokenId);

    emit Burn(_from, _tokenId);
    emit Transfer(_from, address(0), _tokenId);
  }

  /**
   * @dev Method to freeze token
   * @dev (available only for minter contract)
   * @param _tokenId ID of token to be freezed (uint)
   */  
  function freezeToken(
    uint _tokenId
  ) 
    public 
    onlyMinter 
    checkToken(_tokenId) 
  {
    require(!tokenFreezed(_tokenId));
    freezedTokens[_tokenId] = true;
    emit TokenFreeze(_tokenId);
  }

  /**
   * @dev Method to mint token 
   * @dev (available only for minter contract address)
   * @param _to token recepient (address)
   * @param _id new token ID (uint)
   * @param _uri new token URI (string)
   * @return bool method validation status
   */
  function mint(
    address _to,
    uint _id, 
    string _uri
  ) 
    public  
    onlyMinter 
    returns (bool)
  {
    require(address(_to) != address(0));

    totalSupply_ = totalSupply_.add(1);
    uint tokenId = totalSupply_;
    require(!exists(tokenId));
    allTokensIndex[tokenId] = allTokens.length;
    allTokens.push(tokenId);
    tokenEventId[tokenId] = _id;
    tokenURIs[tokenId] = _uri;
    addTokenTo(_to, tokenId);
    bytes memory empty;
    require(safeContract(minter, _to, tokenId, empty));

    emit Mint(_to, tokenId);
    return true;
  }

  /**
   * @dev Method to set new minter contract address 
   * @dev (available only for owner)
   * @param _minter minter contract (address)
   */
  function setMinter(address _minter) external onlyOwner {
    require(_minter != address(0));
    minter = _minter;
  }

  /**
   * @dev Method to freeze any account
   * @dev (available only for owner)
   * @param _who account to be freezed (address)
   */
  function freeze(address _who) external onlyOwner {
    require(!isFreezed(_who));
    freezedList[_who] = true;
    emit Freeze(_who);
  }

  /**
   * @dev Method to unfreeze any account
   * @dev (available only for owner)
   * @param _who account to be unfreezed (address)
   */
  function unfreeze(address _who) external onlyOwner {
    require(isFreezed(_who));
    freezedList[_who] = false;
    emit Unfreeze(_who);
  }

}
