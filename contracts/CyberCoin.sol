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

  /// @dev Token name
  string internal constant name_ = "CyberCoin";
  /// @dev Token symbol
  string internal constant symbol_ = "CYBER";
  /// @dev Token receive magic value
  /// @dev equals to bytes4(keccak256("Cyber Academy"))
  bytes4 internal constant receive_ = 0xf4945cc6;
  /// @dev Total tokens amount
  uint internal totalSupply_;
  /// @dev Array with all tokens IDs
  uint[] internal allTokens;
  /// @dev Minter contract
  address public minter;

  /// @dev Mapping from address to it's tokens balance
  mapping(address => uint) internal balances;
  /// @dev Mapping from address to it's owned tokens array
  mapping(address => uint[]) internal ownedTokens;
  /// @dev Mapping from address to it's all tokens approved address and it's status
  mapping(address => mapping(address => bool)) internal approvedForAll;
  /// @dev Mapping from address to it's freeze status
  mapping(address => bool) internal freezedList;
  /// @dev Mapping from token ID to it's owner address
  mapping(uint => address) internal tokenOwner;
  /// @dev Mapping from token ID to it's index in tokenOwner mapping array
  mapping(uint => uint) internal ownedTokensIndex;
  /// @dev Mapping from token ID to it's approved address
  mapping(uint => address) internal tokenApproval;
  /// @dev Mapping from token ID and it's index in allTokens array
  mapping(uint => uint) internal allTokensIndex;
  /// @dev Mapping from token ID to it's freeze status
  mapping(uint => bool) internal freezedTokens;
  /// @dev Mapping from token ID to it's event ID
  mapping(uint => uint) internal tokenEventId;
  /// @dev Mapping from token ID to it's URI
  mapping(uint => string) internal tokenURIs;

  event Burn(address indexed from, uint tokenId);
  event TokenFreeze(uint tokenId);
  event Freeze(address indexed who);
  event Mint(address indexed to, uint tokenId);

  modifier onlyOwnerOf(uint _tokenId) {
    require(msg.sender == ownerOf(_tokenId));
    _;
  }

  modifier canTransfer(uint _tokenId) {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    require(!tokenFreezed(_tokenId));
    require(!isFreezed(ownerOf(_tokenId)));
    require(!isFreezed(msg.sender));
    _;
  }

  modifier checkFreeze() {
    require(!isFreezed(msg.sender));
    _;
  }

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
   * @dev Method to view total tokens amount
   * @return uint total tokens supply
   */
  function totalSupply() public view returns (uint) {
    return totalSupply_;
  }

  /**
   * @dev Method to view any address tokens balance
   * @param _owner tokens owner (address)
   * @return uint _owner tokens balance
   */
  function balanceOf(address _owner) public view returns (uint) {
    require(_owner != address(0));
    return balances[_owner];
  }

  /**
   * @dev Method to view any token owner address
   * @param _tokenId token ID (uint)
   * @return address _tokenId owner
   */
  function ownerOf(uint _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenOwner[_tokenId];
  }

  /**
   * @dev Method to view token ID by it's allTokens array index
   * @param _index token's allTokens array index (uint)
   * @return uint token ID
   */
  function tokenByIndex(uint _index) public view returns (uint) {
    require(allTokens.length > _index);
    return allTokens[_index];
  }

  /**
   * @dev Method to view all owned of any address tokens
   * @param _owner tokens owner (address)
   * @return uint[] array of _owner owned tokens
   */
  function tokensOf(address _owner) public view returns (uint[]) {
    require(_owner != address(0));
    return ownedTokens[_owner];
  }

  /**
   * @dev Method to view token ID by it's owner address and ownedTokens array index
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
   * @dev Method to view any token ID approved address
   * @param _tokenId token ID (uint)
   * @return address _tokenId approved address
   */
  function getApproved(uint _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenApproval[_tokenId];
  }

  /**
   * @dev Method to view approved for all tokens from any owner to any spender address
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
    internal 
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
   * @dev Method to check the existence of any token ID
   * @param _tokenId validated token ID (uint)
   * @return bool token existence status
   */
  function exists(uint _tokenId) public view returns (bool) {
    return tokenOwner[_tokenId] != address(0);
  }

  function tokenFreezed(uint _tokenId) public view returns (bool) {
    require(exists(_tokenId));
    return freezedTokens[_tokenId];
  }

  function isFreezed(address _who) public view returns (bool) {
    require(_who != address(0));
    return freezedList[_who];
  }

  function eventId(uint _tokenId) public view returns (uint) {
    require(exists(_tokenId));
    return tokenEventId[_tokenId];
  }

  /**
   * @dev Method to view any token URI
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
  {
    bytes memory empty;
    safeTransferFrom(_from, _to, _tokenId);
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
   * @dev Safe method to transfer tokens
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
    
    _clearApproval(_tokenId);
    removeToken(_tokenId);
    addTokenTo(_to, _tokenId);
    safeContract(_from, _to, _tokenId, _data);

    emit Transfer(_from, _to, _tokenId);
  }

  /**
   * @dev Method to call onERC721Received method if tokens recepient is contract
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
  {
    if(!_to.isContract()) {
      ERC721Receiver receiver = ERC721Receiver(_to);
      require(receive_ == receiver.onERC721Received(_from, _tokenId, _data));
    }
  }

  /**
   * @dev Method to approve tokens to spend
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
  {
    require(_spender != ownerOf(_tokenId));
    require(_spender != address(0));
    tokenApproval[_tokenId] = _spender;
    emit Approval(msg.sender, _spender, _tokenId);
  }

  /**
   * @dev Method to set approval for all msg.sender tokens
   * @param _spender tokens spender (address)
   * @param _approve tokens approval status (bool)
   */
  function setApprovalForAll(
    address _spender, 
    bool _approve
  ) 
    public 
  {
    require(_spender != address(0));
    approvedForAll[msg.sender][_spender] = _approve;
  }

  /**
   * @dev Method to clear approvals from any owned token
   * @param _tokenId spending token ID (uint)
   */
  function clearApproval(uint _tokenId) public {
    require(msg.sender == ownerOf(_tokenId));
    _clearApproval(_tokenId);
  }

  /**
   * @dev Method to clear approvals from any token
   * @param _owner token owner (address)
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
   * @dev Method to add token to any address
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
   * @dev Method to remove token from any address
   * @param _from token owner (address)
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
   * @dev Method to burn token from any approved msg.sender address
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
   * @dev Method to burn tokens from any approved msg.sender address
   * @param _tokenIds array with token IDs (uint[])
   */
  function burnTokens(uint[] _tokenIds) public {
    require(_tokenIds.length > 0);
    for(uint i = 0; i < _tokenIds.length; i++) {
      _burn(ownerOf(_tokenIds[i]), _tokenIds[i]);
    }
  }

  /**
   * @dev Internal method to burn token from owner or approved msg.sender address
   * @param _from token owner (address)
   * @param _tokenId token ID (uint)
   */
  function _burn(
    address _from,
    uint _tokenId
  ) 
    internal 
  {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    require(_from != address(0));

    totalSupply_ = totalSupply_.sub(1);
    removeToken(_tokenId);
    _clearApproval(_tokenId);

    emit Burn(_from, _tokenId);
    emit Transfer(_from, address(0), _tokenId);
  }

  /**
   * @dev Method
   */  
  function freezeToken(uint _tokenId) public onlyMinter checkFreeze {
    require(!tokenFreezed(_tokenId));
    freezedTokens[_tokenId] = true;
    emit TokenFreeze(_tokenId);
  }

  /**
   * @dev Method to mint token (available only for minter contract address)
   * @param _to token recepient (address)
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
    assert(!exists(tokenId));
    allTokensIndex[tokenId] = allTokens.length;
    allTokens.push(tokenId);
    tokenEventId[tokenId] = _id;
    tokenURIs[tokenId] = _uri;
    addTokenTo(_to, tokenId);

    emit Mint(_to, tokenId);
    return true;
  }

  /**
   * @dev Method to set new minter contract address (available only for owner)
   * @param _minter minter contract (address)
   */
  function setMinter(address _minter) public onlyOwner {
    require(_minter != address(0));
    minter = _minter;
  }

  function freeze(address _who) external onlyOwner {
    require(!isFreezed(_who));
    freezedList[_who] = true;
    emit Freeze(_who);
  }

}
