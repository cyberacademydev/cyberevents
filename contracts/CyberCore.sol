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
  uint[] public allEvents;

  struct Event {
    uint id;
    uint startTime;
    uint endTime;
    uint ticketPrice;
    uint ticketsAmount;
    uint paidAmount;
    uint ownerPercent;
    uint speakersPercent;
    address[] participants;
    address[] speakers;
    bool canceled;
  }

  mapping (uint => Event) public events;
  mapping (uint => mapping (address => uint)) public paidAmountOf;

  event EventCreated(uint startTime, uint endTime, address speaker);
  event EventCancelled(uint id);

  /**
   * @dev Constructor sets current CyberCoin address to interact with
   * @param _cyber CyberCoin contract (address)
   */
  constructor(CyberCoin _cyber) public {
    require(address(_cyber) != address(0));
    cyber = _cyber;
  }

  /**
   * @dev Gets event data
   * @dev This method if bathed up to two parts
   * @dev because it's too much arguments to return
   * @dev (Compile Error: Stack too deep)
   * @param _id event ID (uint)
   * @return _event event structure (Event)
   */
  function getEventFirst(uint _id)
    public view returns (
      uint id,
      uint startTime,
      uint endTime,
      uint ticketPrice,
      uint ticketsAmount,
      uint paidAmount
    ) 
  {
    return (
      events[_id].id,
      events[_id].startTime,
      events[_id].endTime,
      events[_id].ticketPrice,
      events[_id].ticketsAmount,
      events[_id].paidAmount
    );
  }

  function getEventSecond(uint _id)
    public view returns (
      uint ownerPercent,
      uint speakersPercent,
      address[] participants,
      address[] speakers,
      bool canceled
    ) 
  {
    return(
      events[_id].ownerPercent,
      events[_id].speakersPercent,
      events[_id].participants,
      events[_id].speakers,
      events[_id].canceled
    );
  }

  /**
   * @dev Gets the list of upcoming events IDs
   * @return _events upcoming events (uint[])
   */
  function getUpcomingEvents() public view returns (uint[] _events) {
    uint j = 0;
    for (uint i = allEvents.length; i > 0; i--) {

      if (events[i].startTime > now) {
        _events[j] = i;
        j++;
      }

    }
  }

  /**
   * @dev Function to create new event
   * @param _startTime event start time (uint)
   * @param _endTime event end time (uint)
   * @param _ticketPrice ticket wei price (uint)
   * @param _ticketsAmount ticket amount for this event (uint)
   * @param _ownerPercent owner percent (uint)
   * @param _speakersPercent speakers percent (uint)
   * @param _speakers speakers ethereum accounts (address[])
   */
  function createEvent(
    uint _startTime,
    uint _endTime,
    uint _ticketPrice,
    uint _ticketsAmount,
    uint _ownerPercent,
    uint _speakersPercent,
    address[] _speakers
  ) 
    public 
    onlyOwner
  {
    lastEvent++;
    address[] memory participants_;
    Event memory event_ = Event({
      id              : lastEvent,
      startTime       : _startTime,
      endTime         : _endTime,
      ticketPrice     : _ticketPrice,
      ticketsAmount   : _ticketsAmount,
      paidAmount      : 0,
      participants    : participants_,
      ownerPercent    : _ownerPercent,
      speakersPercent : _speakersPercent,
      speakers        : _speakers,
      canceled        : false
    });
    events[lastEvent] = event_;
  }

  /**
   * @dev Function to cancel event
   * @param _id event ID to be canceled (uint)
   */
  function cancelEvent(uint _id) public onlyOwner {
    require(events[_id].startTime > now);
    events[_id].canceled = true;
    emit EventCancelled(_id);
  }

  /**
   * @dev Sign up function 
   * @param _id event's ID participant
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
   * @dev Function to check on event
   * @param _participant participant's acoount (address)
   * @param _tokenId showed token ID (uint)
   * @notice How it works:
   * @notice app generates QR that contents:
   * @notice - participants current Status ETH address
   * @notice - token ID, that he chose
   * @notice function checks, that _participant
   * @notice is the _tokenId owner
   * @notice then the _tokenId token will be frozen
   * @notice and _participant will receive his cashback
   */
  function checkIn(address _participant, uint _tokenId) 
    public 
    onlyOwner 
  {
    uint id = cyber.eventId(_tokenId);
    require(cyber.isApprovedOrOwner(_participant, _tokenId));
    require(!cyber.tokenFreezed(_tokenId));
    require(events[id].endTime > now);
    require(!events[id].canceled);

    cyber.freezeToken(_tokenId);

    uint cashback = (
      paidAmountOf[id][_participant].div(100).
      mul(100 - events[id].speakersPercent - events[id].ownerPercent)
    );

    _participant.transfer(cashback);
    
  }

  /**
   * @dev Function to close the past event
   * @param _id event ID (uint)
   */
  function closeEvent(uint _id) public onlyOwner {
    require(now > events[_id].endTime);

    if (events[_id].canceled) {

      for (uint i = 0; i < events[_id].participants.length; i++) {
        events[_id].participants[i].transfer(
          paidAmountOf[_id][events[_id].participants[i]]
        ); 
      }

    } else {

      owner.transfer(
        events[_id].paidAmount.div(100).mul(events[_id].ownerPercent)
      );

      for (uint j = 0; j < events[_id].speakers.length; j++) {
        events[_id].speakers[j].transfer(
          events[_id].paidAmount.div(100).mul(events[_id].speakersPercent)
        );
      }

    }

    if (events[_id].ticketsAmount > 0) events[_id].ticketsAmount = 0;
  }

}
