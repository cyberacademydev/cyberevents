pragma solidity ^0.4.24;

import "./CyberCoin.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Cyber Academy DApp core
 * @author Nick - [Facebook](facebook.com/k.kornilov01), [GitHub](github.com/rjkz808)
 * @author Alexandr - [Facebook](facebook.com/profile.php?id=100014804447876)
 */
contract CyberCore is Contactable {
  using SafeMath for uint;

  CyberCoin public token;
  
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
   * @dev Constructor that sets current CyberCoin address to interact with
   * @param _token address CyberCoin contract
   */
  constructor(CyberCoin _token) public {
    require(address(_token) != address(0));
    token = _token;
  }

  /**
   * @dev Gets the event data
   * @dev This method is bathed up to the two parts
   * @dev because there's too much arguments to return
   * @dev and the Solidity compiler return
   * @dev `Compile Error: Stack too deep`
   * @param _id uint ID of the event
   * @return id uint the event ID
   * @return startTime uint the event start time
   * @return endTime uint the event end time
   * @return ticketPrice uint the price for those the tickets will be sold
   * @return ticketsAmount uint participants limit
   * @return paidAmount uint the total paid for the event tickets ETH amount
   */
  function getEventFirst(uint _id)
    public 
    view 
    returns (
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

  /**
   * @dev Gets the event data
   * @param _id uint ID of the event
   * @return ownerPercent uint percent of the paid ETH that will receive the owner
   * @return speakersPercent uint percent of the paid ETH that will receive the speakers
   * @return participants address[] participants list
   * @return speakers address[] speakers list
   * @return canceled bool state of the event (`true` if canceled)
   */
  function getEventSecond(uint _id)
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
    return(
      events[_id].ownerPercent,
      events[_id].speakersPercent,
      events[_id].participants,
      events[_id].speakers,
      events[_id].canceled
    );
  }

  /**
   * @dev Gets the list of the upcoming events IDs
   * @return _events uint[] the upcoming events
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
   * @dev Function to check the existence of the event
   * @param _id uint ID of the validated event
   * @return bool the event existence
   */
  function exists(uint _id) public view returns (bool) {
    return events[_id].startTime > 0 && _id > 0;
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
   * @dev Function to cancel an event
   * @param _id uint an event ID to be canceled
   */
  function cancelEvent(uint _id) public onlyOwner {
    require(exists(_id));
    events[_id].canceled = true;
    emit EventCancelled(_id);
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
   * @param _id event's ID participant
   */
  function signUp(uint _id) public payable {
    require(now < events[_id].startTime);
    require(events[_id].ticketsAmount > 0);
    require(msg.value >= events[_id].ticketPrice);
    require(msg.sender != owner);
    require(!events[_id].canceled);
    require(token.mint(msg.sender, _id));
    events[_id].ticketsAmount.sub(1);
  }

  /**
   * @dev Function to check the participant on the event
   * @param _participant address the participant's account
   * @param _tokenId uint the showed token ID
   * @notice How it works?
   * @notice App generates QR that contents:
   * @notice - participant's current Status ETH address
   * @notice - ID of the token that he chose
   * @notice function checks, that the `_participant` is the `_tokenId` owner
   * @notice then the token will be frozen and _participant will receive his 
   * @notice cashback (if it's doesn't equals to 0)
   */
  function checkIn(address _participant, uint _tokenId) 
    public 
    onlyOwner 
  {
    uint id = token.eventId(_tokenId);
    require(token.isApprovedOrOwner(_participant, _tokenId));
    require(!token.tokenFrozen(_tokenId));
    require(events[id].endTime > now);
    require(!events[id].canceled);

    token.freeze(_tokenId);

    if (events[_tokenId].ticketPrice > 0) {
      uint cashback = (
        events[id].ticketPrice.div(100).
        mul(100 - events[id].speakersPercent - events[id].ownerPercent)
      );
    }
    
    _participant.transfer(cashback);
  }

  /**
   * @dev Function to close the past event
   * @param _id uint ID of the event to be closed
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
        events[_id].paidAmount.
        div(100).
        mul(events[_id].ownerPercent)
      );

      for (uint j = 0; j < events[_id].speakers.length; j++) {
        events[_id].speakers[j].transfer(
          events[_id].paidAmount.
          div(100).
          mul(events[_id].speakersPercent).
          div(events[_id].speakers.length)
        );
      }

    }

    if (events[_id].ticketsAmount > 0) events[_id].ticketsAmount = 0;
  }

}
