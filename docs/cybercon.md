# cyberCon0

For the event one contract must be deployed. This contract must define all interactions between organiser, speakers and participants.

## Roles

### Organizer

Organiser functions:
- deploy contract to mainnet
- promote event
- confirm speakers participation
- control checkin
- subscribe all event costs
- benefit from auction by share of revenue that is bided during auction deployment but can be changed before profit distribution.

Organizer deploy contract with the following parameters:
- name of event: cybercon0
- place of event: Korpus 8
- minimal bid: 0.2 ETH
- amount of tickets: 200
- share of revenue: 50%
- timestamp of checkin start: 09.00 14 December
- timestamp of profit distribution: 17.00 14 December

## Speakers

Everybody can bid for speakership. The bid can be any amount of ETH speaker want to lose in the event she miss his speakership. Based on this amount all profit from cyberCon is distributed to speakers. In addition to ETH he must submit his name, report name and duration in minutes. Amount of the bid does not affect organisers decision to confirm participation.

## Participants

Everybody can bid for participation. Minimal bid is 0.2 ETH due to minimal expenses needed to cover the catering. At the moment of ticket distribution bids are sorted by amount. Top 200 bids get the right to issue tickets, the other get the right to return bids back.

## Processes

## Auction

At this stage contract is being deployed to mainnet by organizer. From the moment of deployment participants can participate in the auction, speakers can bid their participation and organizer can confirm speakers.

## Checkin

Checkin must start at 09.00 14 December

After this timestamp bids can not be accepted, participation can not be confirmed. After checkin the ticket can be issued and redeemed under control of organizer. Also losing bids can be returned back

## Profit

Profit distribution must be executed at 17.00 14 December.

In order to correctly distribute speakers rewards according to speakers bids actual speakers must be submitted by organiser before calling the function.
