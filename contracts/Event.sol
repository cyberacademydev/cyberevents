pragma solidity ^0.4.24;

import "./Ticket.sol";


/**
 * @title Cyberevents core
 * @author Kolya Kornilov
 */
contract Event is Ticket {
  uint public lastEvent;
  uint[] public allEvents;

  struct EventPattern {
    uint eventId;
    uint startTime;
    uint endTime;
    uint ticketPrice;
    uint ticketsAmount;
    uint paidAmount;
    uint cashbackPercent;
    uint ownerPercent;
    uint speakersPercent;
    uint8 hashFunction;
    uint8 size;
    bytes32 hash;
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
   * @dev Gets the event properties
   * @param _eventId uint ID of the event
   * @return startTime uint the event start time
   * @return endTime uint the event end time
   * @return ticketPrice uint the ticket wei price
   * @return cashbackPercent uint the cashback percent
   * @return ownerPercent uint the owner percent
   * @return speakersPercent uint the speakers percent
   * @return speakers address[] the speakers ethereum accounts list
   */
  function getEventProperties(uint _eventId)
    public
    view
    returns (
      uint startTime,
      uint endTime,
      uint ticketPrice,
      uint cashbackPercent,
      uint ownerPercent,
      uint speakersPercent,
      address[] speakers
    )
  {
    require(eventExists(_eventId));
    return(
      events[_eventId].startTime,
      events[_eventId].endTime,
      events[_eventId].ticketPrice,
      events[_eventId].cashbackPercent,
      events[_eventId].ownerPercent,
      events[_eventId].speakersPercent,
      events[_eventId].speakers
    );
  }

  /**
   * @dev Gets the event state
   * @param _eventId uint ID of the event
   * @return ticketsAmount uint the remaining tickets amount
   * @return paidAmount uint the event paid wei amount
   * @return participants address[] the event participants
   * @return canceled bool the event cancel state
   */
  function getEventState(uint _eventId)
    public
    view
    returns (
      uint ticketsAmount,
      uint paidAmount,
      address[] participants,
      bool canceled
    )
  {
    require(eventExists(_eventId));
    return(
      events[_eventId].ticketsAmount,
      events[_eventId].paidAmount,
      events[_eventId].participants,
      events[_eventId].canceled
    );
  }

  /**
   * @dev Gets the event metadata
   * @param _eventId uint ID of the event
   * @return hash bytes32 the IPFS data hash
   * @return hashFunction uint8 the hash function used to generate hash
   * @return size uint8 the hash size
   */
  function getEventData(uint _eventId)
    public
    view
    returns (
      bytes32 hash,
      uint8 hashFunction,
      uint8 size
    )
  {
    require(eventExists(_eventId));
    return(
      events[_eventId].hash,
      events[_eventId].hashFunction,
      events[_eventId].size
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
   * @dev - participant pays wei for a ticket
   * @dev - the function calls the CyberCoin `mint` function
   * @dev - partipant receives his ticket (token)
   * @notice Participant can paid amount bigger, that the ticket price but
   * @notice when he will receive the cashback he will get the participant
   * @notice percent only from the ticket price, so amount paid from above will
   * @notice share the contract owner and speakers
   * @param _eventId uint event's ID participant
   * @param _data bytes32 value will be used in the `checkIn` function
   */
  function signUp(uint _eventId, bytes32 _data) public payable {
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
    paidAmountOf[msg.sender][_eventId] = msg.value;

    emit SignUp(msg.sender, _eventId);
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

    if (events[_tokenId].ticketPrice > 0 wei) {
      ownerOf(_tokenId).transfer(
        events[eventId(_tokenId)].ticketPrice.div(100).
        mul(events[eventId(_tokenId)].cashbackPercent)
      );
      events[eventId(_tokenId)].paidAmount = (
        events[eventId(_tokenId)].paidAmount.
        sub(
          events[eventId(_tokenId)].ticketPrice.div(100).
          mul(events[eventId(_tokenId)].cashbackPercent)
        )
      );
      paidAmountOf[ownerOf(_tokenId)][eventId(_tokenId)] = (
        paidAmountOf[ownerOf(_tokenId)][eventId(_tokenId)].
        sub(
          events[eventId(_tokenId)].ticketPrice.div(100).
          mul(events[eventId(_tokenId)].cashbackPercent)
        )
      );
    }

    emit CheckIn(ownerOf(_tokenId), eventId(_tokenId));
  }

  /**
   * @dev Function to refund a token
   * @param _tokenId uint ID of the token to be refunded
   */
  function refund(uint _tokenId) public {
    require(events[eventId(_tokenId)].canceled);
    require(exists(_tokenId));
    require(eventExists(eventId(_tokenId)));

    if (!tokenFrozen(_tokenId)) _freeze(_tokenId);
    if (events[eventId(_tokenId)].ticketPrice > 0 wei) {
      msg.sender.transfer(paidAmountOf[msg.sender][eventId(_tokenId)]);
      events[eventId(_tokenId)].paidAmount = (
        events[eventId(_tokenId)].paidAmount.
        sub(paidAmountOf[msg.sender][eventId(_tokenId)])
      );
      paidAmountOf[msg.sender][eventId(_tokenId)] = 0 wei;
    }

    emit Refund(msg.sender, eventId(_tokenId));
  }

  /**
   * @dev Function to create a new event
   * @param _startTime uint the event start time
   * @param _endTime uint the event end time
   * @param _ticketPrice uint the ticket wei price
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
    uint _cashbackPercent,
    uint _ownerPercent,
    uint _speakersPercent,
    uint8 _hashFunction,
    uint8 _size,
    bytes32 _hash,
    address[] _speakers
  )
    public
    onlyOwner
  {
    require(_startTime > now);
    require(_endTime > _startTime);
    require(_ticketsAmount > 0);
    require(_speakers.length > 0);
    require(_ownerPercent.add(_speakersPercent) == 100);
    require(_cashbackPercent <= 100);

    lastEvent++;
    address[] memory participants_;
    EventPattern memory event_ = EventPattern({
      eventId         : lastEvent,
      startTime       : _startTime,
      endTime         : _endTime,
      ticketPrice     : _ticketPrice,
      ticketsAmount   : _ticketsAmount,
      paidAmount      : 0 wei,
      cashbackPercent : _cashbackPercent,
      ownerPercent    : _ownerPercent,
      speakersPercent : _speakersPercent,
      hashFunction    : _hashFunction,
      size            : _size,
      hash            : _hash,
      participants    : participants_,
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
    require(eventExists(_eventId));

    if (!events[_eventId].canceled && events[_eventId].paidAmount > 0 wei) {
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
