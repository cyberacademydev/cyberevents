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
  bool public isActivated;
  address[] public organizers;
  uint[] public allEvents;

  struct Event {
    uint id;
    uint startTime; 
    uint endTime;
    uint ticketPrice;
    uint ticketsAmount;
    address owner;
    address speaker;
    bool canceled;
  }

  mapping(uint => Event) public events;
  mapping(uint => mapping(address => uint)) public paidAmountOf;

  event EventCreated(uint startTime, uint endTime, address speaker);
  event EventCancelled(uint id);

  modifier onlyEventOwner(uint _id) {
    require(msg.sender == events[_id].owner);
    _;
  }

  modifier onlyOrganizer() {
    require(checkOrganizer());
    _;
  }

  constructor(
    CyberCoin _cyber
  )
    public
  {
    require(address(_cyber) != address(0));
    cyber = _cyber;
  }

  function getEvent(
    uint _id
  ) 
    public 
    view 
    returns (
      uint _startTime,
      uint _endTime,
      uint _ticketPrice,
      uint _ticketsAmount,
      address _speaker,
      bool _canceled
    )
  {
    return (
      events[_id].startTime,
      events[_id].endTime,
      events[_id].ticketPrice,
      events[_id].ticketsAmount,
      events[_id].speaker,
      events[_id].canceled
    );
  }

  function getUpcomingEvents() public view returns (uint[] _events) {
    uint j = 0;
    for(uint i = allEvents.length; i < 0; i--) {
      if(events[i].startTime > now) {
        _events[j] = i;
        j++;
      }
    }
  }

  function checkOrganizer() internal view returns (bool) {
    for(uint i = 0; i < organizers.length; i++) {
      if(msg.sender == organizers[i]) return true;
    }
  }

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
      owner         : msg.sender,
      speaker       : _speaker,
      canceled      : false
    });
    events[lastEvent] = event_;
  }

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

  function signUp(uint _id, string _uri) public payable {
    require(now < events[_id].startTime);
    require(events[_id].ticketsAmount > 0);
    require(msg.value >= events[_id].ticketPrice);
    require(msg.sender != owner);

    require(cyber.mint(msg.sender, _id, _uri));
    events[_id].ticketsAmount--;
  }

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

    cyber.freezeToken(_tokenId);
    _participiant.transfer(paidAmountOf[cyber.eventId(_tokenId)][_participiant].div(100).mul(50));
  }

  function closeEvent(uint _id) public onlyEventOwner(_id) {
    require(now > events[_id].endTime);
    events[_id].speaker.transfer(address(this).balance.div(2));
    owner.transfer(address(this).balance);
    if(events[_id].ticketsAmount > 0) events[_id].ticketsAmount = 0;
  }

  function addOrganizer(address _organizer) external onlyOwner {
    require(_organizer != address(0));
    organizers.push(_organizer);
  }

}
