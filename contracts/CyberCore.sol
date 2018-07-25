pragma experimental ABIEncoderV2;
pragma solidity ^0.4.24;

import "./CyberCoin.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Cyber Academy events core contract
 * @author Nick (facebook.com/k.kornilov01)
 * @author Alexandr (facebook.com/profile.php?id=100014804447876)
 */
contract CyberCore is Contactable {

  using SafeMath for uint;

  CyberCoin public cyber;

  uint public lastEvent;
  address[] public organizers;
  uint[] public allEvents;

  struct Event {
    uint id;
    uint startTime; 
    uint endTime;
    uint ticketPrice;
    uint ticketsAmount;
    uint paidAmount;
    address[] participiants;
    address owner;
    address speaker;
    bool canceled;
  }

  mapping(uint => Event) public events;
  mapping(uint => mapping(address => uint)) public paidAmountOf;

  event EventCreated(uint startTime, uint endTime, address speaker);
  event EventCancelled(uint id);

  /**
   * @dev Throws if msg.sender isn't this event owner
   * @param _id event ID (uint)
   */
  modifier onlyEventOwner(uint _id) {
    require(msg.sender == events[_id].owner);
    _;
  }

  /**
   * @dev Throws if msg.sender isn't organizer
   */
  modifier onlyOrganizer() {
    require(checkOrganizer());
    _;
  }

  /**
   * @dev Constructor that sets current CyberCoin address to interact with
   * @param _cyber CyberCoin contract (address)
   */
  constructor(
    CyberCoin _cyber
  )
    public
  {
    require(address(_cyber) != address(0));
    cyber = _cyber;
  }

  /**
   * @dev Gets event by it's ID
   * @param _id event ID (uint)
   * @return _event event structure (Event)
   */
  function getEvent(
    uint _id
  ) 
    public 
    view 
    returns (Event _event)
  {
    return(events[_id]);
  }

  /**
   * @dev Gets array with upcoming events IDs
   * @return _events upcoming events (uint[])
   */
  function getUpcomingEvents() public view returns (uint[] _events) {
    uint j = 0;
    for(uint i = allEvents.length; i > 0; i--) {
      if(events[i].startTime > now) {
        _events[j] = i;
        j++;
      }
    }
  }

  /**
   * @dev
   */
  function checkOrganizer() internal view returns (bool) {
    for(uint i = 0; i < organizers.length; i++) {
      if(msg.sender == organizers[i]) return true;
    }
    return false;
  }

  /**
   * @dev Method to create new event
   * @dev (available only for organizer)
   * @param _startTime event start time (uint)
   * @param _endTime event end time (uint)
   * @param _ticketPrice ticket wei price (uint)
   * @param _ticketsAmount ticket amount for this event (uint)
   * @param _speaker speaker ethereum account (address)
   */
  function createEvent(
    uint _startTime,
    uint _endTime,
    uint _ticketPrice,
    uint _ticketsAmount,
    address _speaker
  ) 
    public 
    onlyOrganizer
  {
    lastEvent++;
    Event memory event_ = Event({
      id            : lastEvent,
      startTime     : _startTime,
      endTime       : _endTime,
      ticketPrice   : _ticketPrice,
      ticketsAmount : _ticketsAmount,
      paidAmount    : 0,
      participiants : [],
      owner         : msg.sender,
      speaker       : _speaker,
      canceled      : false
    });
    events[lastEvent] = event_;
  }

  /**
   * @dev Method to cancel event
   * @dev (available only for event owner)
   * @param _id event ID to be canceled (uint)
   */
  function cancelEvent(
    uint _id
  )
    public
    onlyEventOwner(_id)
  {
    require(events[_id].startTime > now);
    events[_id].canceled = true;
    emit EventCancelled(_id);
  }

  /**
   * @dev 
   */
  function signUp(uint _id, string _uri) public payable {
    require(now < events[_id].startTime);
    require(events[_id].ticketsAmount > 0);
    require(msg.value >= events[_id].ticketPrice);
    require(msg.sender != owner);
    require(!events[_id].canceled);

    require(cyber.mint(msg.sender, _id, _uri));
    events[_id].ticketsAmount--;
  }

  /**
   * @dev 
   */
  function checkin(
    address _participiant, 
    uint _tokenId
  ) 
    public 
    onlyEventOwner(cyber.eventId(_tokenId)) 
  {
    require(cyber.isApprovedOrOwner(_participiant, _tokenId));
    require(!cyber.tokenFreezed(_tokenId));
    require(events[cyber.eventId(_tokenId)].endTime > now);
    require(!events[cyber.eventId(_tokenId)].canceled);

    cyber.freezeToken(_tokenId);
    _participiant.transfer(paidAmountOf[cyber.eventId(_tokenId)][_participiant].div(100).mul(50));
  }

  /**
   * @dev Method to close past event
   * @dev (available only for event owner)
   * @param _id event ID (uint)
   */
  function closeEvent(uint _id) public onlyEventOwner(_id) {
    require(now > events[_id].endTime);

    if(events[_id].canceled) {
      for(uint i = 0; i < events[_id].participiants.length; i++) {
        events[_id].participiants[i].transfer(paidAmountOf[_id][events[_id].participiants[i]]); 
      }
    } else {
      events[_id].speaker.transfer(events[_id].paidAmount.div());
      events[_id].owner.transfer(address(this).balance);
    }

    if(events[_id].ticketsAmount > 0) events[_id].ticketsAmount = 0;
  }

  /**
   * @dev Method to add new organizer
   * @dev (available only for owner)
   * @param _organizer organizer account (address)
   */
  function addOrganizer(address _organizer) external onlyOwner {
    require(_organizer != address(0));
    organizers.push(_organizer);
  }

}
