pragma solidity ^0.4.24;

import "./Ticket.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Cyberevents core
 */
contract Event is Ticket {
  using SafeMath for uint;

  uint public lastEvent;
  uint[] public allEvents;

  struct EventPattern {
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

  mapping (uint => EventPattern) public events;
  mapping (address => mapping (uint => bool)) public participations;
  mapping (address => mapping (uint => uint)) public paidAmountOf;

  event EventCreated(uint eventId);
  event EventCanceled(uint eventId);
  event EventClosed(uint eventId);
  event SignUp(address indexed participant, uint indexed eventId);
  event CheckIn(address indexed participant, uint indexed eventId);
  event Refund(address indexed participant, uint indexed eventId);

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
    require(eventExists(_eventId));
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
    require(eventExists(_eventId));
    return(
      events[_eventId].ownerPercent,
      events[_eventId].speakersPercent,
      events[_eventId].participants,
      events[_eventId].speakers,
      events[_eventId].canceled
    );
  }

  /**
   * @dev Function to check the existence of the event
   * @param _eventId uint ID of the validated event
   * @return bool the event existence
   */
  function eventExists(uint _eventId) public view returns (bool) {
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
    require(eventExists(_eventId));
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

    require(_mint(msg.sender, _eventId, _data, ""));
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
    require(!tokenFrozen(_tokenId));
    require(events[eventId(_tokenId)].endTime > now);
    require(!events[eventId(_tokenId)].canceled);
    require(keccak256(abi.encodePacked(_data)) == getTokenData(_tokenId));

    _freeze(_tokenId);

    if (events[_tokenId].ticketPrice > 0) {
      ownerOf(_tokenId).transfer(
        events[eventId(_tokenId)].ticketPrice.div(100).
        mul(100 - events[eventId(_tokenId)].
        speakersPercent - events[eventId(_tokenId)].
        ownerPercent)
      );
    }

    emit CheckIn(ownerOf(_tokenId), eventId(_tokenId));
  }

  /**
   * @dev Function to refund a token
   * @param _tokenId uint ID of the token to be refunded 
   */
  function refund(uint _tokenId) public {
    require(exists(_tokenId));
    require(eventExists(eventId(_tokenId)));
    require(events[eventId(_tokenId)].canceled);

    if (!tokenFrozen(_tokenId)) _freeze(_tokenId);
    msg.sender.transfer(paidAmountOf[msg.sender][eventId(_tokenId)]);

    emit Refund(msg.sender, eventId(_tokenId));
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
    EventPattern memory event_ = EventPattern({
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
    allEvents.push(lastEvent);

    emit EventCreated(lastEvent);
  }

  /**
   * @dev Function to cancel an event
   * @param _eventId uint an event ID to be canceled
   */
  function cancelEvent(uint _eventId) public onlyOwner {
    require(eventExists(_eventId));
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

    if (!events[_eventId].canceled) {
      owner.transfer(
        events[_eventId].paidAmount.
        div(100).
        mul(events[_eventId].ownerPercent)
      );

      if (events[_eventId].speakers.length == 1) {
        events[_eventId].speakers[0].transfer(
          events[_eventId].paidAmount.
          div(100).
          mul(events[_eventId].speakersPercent)
        );
      }
    }
    if (events[_eventId].ticketsAmount > 0) events[_eventId].ticketsAmount = 0;

    emit EventClosed(_eventId);
  }

}
