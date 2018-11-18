# cyberCon0

For [the event](https://www.eventbrite.com/e/cybercon18-tickets-52430689604) one contract must be deployed. This contract must define basic interactions between organizer, speakers and participants.

## Roles

### Organizer

Organizer functions:
- deploy contract to mainnet
- *[off-chain]* promote event
- confirm speakers participation
- control checkin
- *[off-chain]* subscribe all event costs
- benefit from auction by share of revenue that is bided during auction process, but can be changed before profit distribution (due to the re-distribution of missed speakers' deposits)

Organizer deploy contract with the following parameters:
- name of event: *cybercon0*
- place of event: *Korpus 8*
- minimal ticket bid: *0.2 ETH*
- amount of tickets: *200*
- organizer's share of revenue: *50%*
- number of speakers: *4*
- minimum report duration: *15 minutes*
- maximum report duration: *60 minutes*
- timestamp of checkin start: *09.00 14 December*
- timestamp of profit distribution: *17.00 14 December*

### Speakers

Speaker reports some topic during the event.

Everybody can bid for the speakership. The bid can be any amount of ETH speaker ready to loose in case she miss her speakership (we call her *Missed Speaker* in that case). This lost amount is distributed to checked-in speakers along with profit share which comes from [the ticket auction](#auction). In addition to ETH she must submit her name, report topic and duration in minutes. Amount of the bid should not affect organizers decision to approve speaker's participation (**though I have no idea how to garantee this**).

### Attendees

Attendee comes to the event to listen for reports.

Everybody can bid for attendance. Minimal bid is being set by the contract's parameter (e.g. 0.2 ETH) and comes from the minimal expenses needed to cover the event setup costs (hall rental fees, catering, transportation, etc.). At the moment of ticket distribution bids are sorted by their amounts descending. Top 200 bids get the right to issue tickets, the other get the right to return bids back.

## Processes

### Auction

At this stage contract is being deployed to mainnet by organizer. From the moment of deployment attendees can participate in the ticket auction, speakers can bid for their speakership, and organizer can approve speakers.

Ticket auction works as a classical [English Auction](https://en.wikipedia.org/wiki/English_auction) with following **rules**:

+ **Opening Bid** equals to \<*minimal ticket bid*\> specified in smart contract
+ **Minimum increment** equals to Opening Bid
+ **Auction starts** at the moment of contract deployment
+ **Auction finishes** at the \<*timestamp of checkin start*\>

After action finishes, the winners should be determined by following rule:

+ Take top 200 (\<*amount of tickets*\>) distinct addresses from list of bids sorted by value descending.

### Checkin

Checkin must start at \<*timestamp of checkin start*\> (*09.00 14 December*).

After this timestamp bids can not be accepted, speakership can not be approved. After checkin the ticket can be issued and redeemed under control of organizer. **we certainly need to specify this process in detail** Also, losing ticket bids can be returned back.

### Profit Distribution

Profit distribution must be executed right at the *[timestamp of profit distribution]*  (*17.00 14 December*).

In order to correctly count loosing speaker's bids in rewards distribution, checked-in speakers must be submitted by organizer before calling the function.

For the sake of simplicity, we do not count costs explicitly in the contract. Costs are Orginizer's risk, and are accounted in her revenue share rate.

Profit Distribution rules are:
- \<speaker's profit> =

  (\<total revenue from ticket auction> * \<speakers share of revenue (20%)>) *
  
  (\<total deposits of checked-in speakers> / \<total deposit of speakers>)

- \<organizer's profit> =
  (\<total revenue from ticket auction> * \<organizer share of revenue (80%)>) +
  <\total deposits of missed speakers>

- \<missed speaker loss> = her deposit
