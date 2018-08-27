pragma solidity ^0.4.24;

import "./CyberCoin.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Cyber Academy DApp core
 * @author [Kolya Kornilov](https://facebook.com/k.kornilov01)
 */
contract CyberCore is Contactable {
  using SafeMath for uint;

  CyberCoin public token;

  uint public lastEvent;
  uint[] public allEvents;

  struct Event {
    uint eventId;
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
  mapping (address => mapping (uint => bool)) public participations;
  mapping (uint => mapping (address => uint)) public paidAmountOf;

  event EventCreated(uint eventId);
  event EventCanceled(uint eventId);
  event EventClosed(uint eventId);
  event SignUp(address indexed participant, uint indexed eventId);
  event CheckIn(address indexed participant, uint indexed eventId);

  /**
   * @dev Constructor that sets current CyberCoin address to interact with
   * @param _token address CyberCoin contract
   */
  constructor(CyberCoin _token) public {
    require(address(_token) != address(0));
    token = _token;
  }

  /**
   * @dev Fallback function
   * @dev Calls the `signUp` function with the last event ID and keccak256 of 
   * @dev the msg.data in the parameters
   */
  function() payable {
    require(signUp(lastEvent, keccak256(msg.data)));
  }

  /**
   * @dev Gets the event data
   * @dev This method is bathed up to the two parts
   * @dev because there's too much arguments to return
   * @dev and the Solidity compiler returns
   * @dev `Compile Error: Stack too deep`
   * @param _eventId uint ID of the event
   * @return eventId uint the event ID
   * @return startTime uint the event start time
   * @return endTime uint the event end time
   * @return ticketPrice uint the price for those the tickets will be sold
   * @return ticketsAmount uint participants limit
   * @return paidAmount uint the total paid for the event tickets ETH amount
   */
  function getEventFirst(uint _eventId)
    public 
    view 
    returns (
      uint eventId,
      uint startTime,
      uint endTime,
      uint ticketPrice,
      uint ticketsAmount,
      uint paidAmount
    ) 
  {
    require(exists(_eventId));
    return (
      events[_eventId].eventId,
      events[_eventId].startTime,
      events[_eventId].endTime,
      events[_eventId].ticketPrice,
      events[_eventId].ticketsAmount,
      events[_eventId].paidAmount
    );
  }

  /**
   * @dev Gets the event data
   * @param _eventId uint ID of the event
   * @return ownerPercent uint percent of the paid ETH that will receive the owner
   * @return speakersPercent uint percent of the paid ETH that will receive the speakers
   * @return participants address[] participants list
   * @return speakers address[] speakers list
   * @return canceled bool state of the event (`true` if canceled)
   */
  function getEventSecond(uint _eventId)
    public 
    view 
    returns (
      uint ownerPercent,
      uint speakersPercent,
      address[] participants,
      address[] speakers,
      bool canceled
    ) 
  {
    require(exists(_eventId));
    return(
      events[_eventId].ownerPercent,
      events[_eventId].speakersPercent,
      events[_eventId].participants,
      events[_eventId].speakers,
      events[_eventId].canceled
    );
  }

  /**
   * @dev Gets the list of the upcoming events IDs
   * @return _events uint[] the upcoming events list
   */
  function getUpcomingEvents() public view returns (uint[] _events) {
    uint j = 0;
    for (uint i = lastEvent; i > 0; i--) {
      if (events[i].endTime > now) {
        _events[j] = i;
        j++;
      } else {
        return _events;
      }
    }
  }

  /**
   * @dev Function to check the existence of the event
   * @param _eventId uint ID of the validated event
   * @return bool the event existence
   */
  function exists(uint _eventId) public view returns (bool) {
    return _eventId <= lastEvent;
  }

  /**
   * @dev Function to get the participation status of an account in the 
   * @dev specified event
   * @param _who address perhaps the participant
   * @param _eventId uint ID of the event
   * @return bool `true` if participated
   */
  function participated(address _who, uint _eventId) 
    public 
    view 
    returns (bool) 
  {
    require(_who != address(0));
    require(exists(_eventId));
    return participations[_who][_eventId];
  }

  /**
   * @dev Function to sign up a new participant
   * @dev - participant pays ETH for a ticket
   * @dev - the function calls the CyberCoin `mint` function
   * @dev - partipant receives his ticket (token)
   * @notice Participant can paid amount bigger, that the ticket price but 
   * @notice when he will receive the cashback he will get the participant
   * @notice percent only from the ticket price, so amount paid from above will
   * @notice share the contract owner and speakers
   * @param _eventId uint event's ID participant
   * @param _data bytes32 value will be used in the `checkIn` function
   */
  function signUp(uint _eventId, bytes32 _data) public payable returns (bool) {
    require(now < events[_eventId].startTime);
    require(events[_eventId].ticketsAmount > 0);
    require(msg.value >= events[_eventId].ticketPrice);
    require(msg.sender != owner);
    require(!participated(msg.sender, _eventId));
    require(!events[_eventId].canceled);

    require(token.mint(msg.sender, _eventId, _data));
    events[_eventId].ticketsAmount = events[_eventId].ticketsAmount.sub(1);
    events[_eventId].paidAmount = events[_eventId].paidAmount.add(msg.value);
    events[_eventId].participants.push(msg.sender);
    participations[msg.sender][_eventId] = true;

    emit SignUp(msg.sender, _eventId);
    return true;
  }

  /**
   * @dev Function to check the participant on the event
   * @param _tokenId uint ID of the token minted for the specified event
   * @param _data string the token data
   * @notice the `keccak256` of the `_data` should be equal to the specified 
   * @notice token `bytes32` data (can be received from the `getTokenData(uint)` function)
   */
  function checkIn(uint _tokenId, string _data) 
    public 
    onlyOwner 
  {
    require(!token.tokenFrozen(_tokenId));
    require(events[token.eventId(_tokenId)].endTime > now);
    require(!events[token.eventId(_tokenId)].canceled);
    require(keccak256(_data) == token.getTokenData(_tokenId));

    token.freeze(_tokenId);

    if (events[_tokenId].ticketPrice > 0) {
      uint cashback = (
        events[token.eventId(_tokenId)].ticketPrice.div(100).
        mul(100 - events[token.eventId(_tokenId)].
        speakersPercent - events[token.eventId(_tokenId)].
        ownerPercent)
      );
    }
    token.ownerOf(_tokenId).transfer(cashback);

    emit CheckIn(token.ownerOf(_tokenId), token.eventId(_tokenId));
  }

  /**
   * @dev Function to create a new event
   * @param _startTime uint the event start time
   * @param _endTime uint the event end time
   * @param _ticketPrice uint the ticket ETH price
   * @param _ticketsAmount uint the tickets amount for this event
   * @param _ownerPercent uint the owner percent
   * @param _speakersPercent uint the speakers percent
   * @param _speakers address[] the speakers ethereum accounts list
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
    require(_startTime > now);
    require(_endTime > _startTime);
    require(_ticketsAmount > 0);
    require(_speakers.length > 0);
    require(_ownerPercent.add(_speakersPercent) <= 100);

    lastEvent++;
    address[] memory participants_;
    Event memory event_ = Event({
      eventId         : lastEvent,
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

    emit EventCreated(lastEvent);
  }

  /**
   * @dev Function to cancel an event
   * @param _eventId uint an event ID to be canceled
   */
  function cancelEvent(uint _eventId) public onlyOwner {
    require(exists(_eventId));
    require(!events[_eventId].canceled);
    events[_eventId].canceled = true;
    emit EventCanceled(_eventId);
  }

  /**
   * @dev Function to close the past event
   * @param _eventId uint ID of the event to be closed
   */
  function closeEvent(uint _eventId) public onlyOwner {
    require(now > events[_eventId].endTime);

    if (events[_eventId].canceled) {
      for (uint i = 0; i < events[_eventId].participants.length; i++) {
        events[_eventId].participants[i].transfer(
          paidAmountOf[_eventId][events[_eventId].participants[i]]
        ); 
      }
    } else {
      owner.transfer(
        events[_eventId].paidAmount.
        div(100).
        mul(events[_eventId].ownerPercent)
      );

      for (uint j = 0; j < events[_eventId].speakers.length; j++) {
        events[_eventId].speakers[j].transfer(
          events[_eventId].paidAmount.
          div(100).
          mul(events[_eventId].speakersPercent).
          div(events[_eventId].speakers.length)
        );
      }
    }
    if (events[_eventId].ticketsAmount > 0) events[_eventId].ticketsAmount = 0;

    emit EventClosed(_eventId);
  }

}
