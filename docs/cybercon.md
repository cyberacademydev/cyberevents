# cyberCon0
For [the event](https://www.eventbrite.com/e/cybercon18-tickets-52430689604) one contract must be deployed. This contract must define basic interactions between Organizer, Speakers and Attendees.

## Roles

### Organizer

Organizer functions:
- deploy contract to mainnet
- *[off-chain]* promote event
- confirm Speaker's participation
- control checkin
- *[off-chain]* subscribe all event costs
- benefit from auction by share of revenue that is bided during auction process, but can be changed before profit distribution (due to the re-distribution of missed Speakers' deposits)

Organizer deploy contract with the following parameters:
- name of event: *cybercon0*
- place of event: *Korpus 8*
- minimal ticket bid: *0.2 ETH*
- amount of tickets: *200*
- Organizer's share of revenue: *50%*
- number of Speakers: *4*
- minimum report duration: *15 minutes*
- maximum report duration: *60 minutes*
- timestamp of checkin start: *09.00 14 December*
- timestamp of profit distribution: *17.00 14 December*

### Speakers

Speaker reports some topic during the event.

Everybody can bid for the speakership. The bid can be any amount of ETH Speaker ready to loose in case she miss her speakership (we call her *Missed Speaker* in that case). This lost amount goes to the Organizer to compensate reputational loss coming from missed speaker. Checked-in speakers get profit share which comes from [the ticket auction](#auction) (see [Profit Distribution](#profit-distribution). In addition to ETH she must submit her name, report topic and duration in minutes. Amount of the bid should not affect Organizers decision to approve Speaker's participation (**though I have no idea how to garantee this**).

### Attendees

Attendee comes to the event to listen for reports.

Everybody can bid for attendance. Minimal bid is being set by the contract's parameter (e.g. 0.2 ETH) and comes from the minimal expenses needed to cover the event setup costs (hall rental fees, catering, transportation, etc.). At the moment of ticket distribution bids are sorted by their amounts descending. Top 200 bids get the right to issue tickets, the other get the right to return bids back.

## Processes

### Auction

At this stage contract is being deployed to mainnet by Organizer. From the moment of deployment Attendees can participate in the ticket auction, Speakers can bid for their speakership, and Organizer can approve Speakers.

Ticket auction works as a classical [English Auction](https://en.wikipedia.org/wiki/English_auction) with following **rules**:

+ **Opening Bid** equals to \<*minimal ticket bid*\> specified in smart contract
+ **Minimum increment** equals to Opening Bid
+ **Auction starts** at the moment of contract deployment
+ **Auction finishes** at the \<*timestamp of checkin start*\>

After action finishes:

+ the winners should be determined by following rule:

    Take top 200 (\<*amount of tickets*\>) distinct addresses from list of bids sorted by value descending.

+ the loosers get their bids back by batch transaction

### Checkin

+ **Opens** at \<*timestamp of checkin start*\> (*09.00 14 December*).
+ **Closes** at \<*timestamp of profit distribution*\> minus *1 hour* (*16.00 14 December*).

**Since checkin opened:**

+ no bids can be accepted, 
+ no new Speakers can be approved,
+ losing Attendees bids are returned back.

**Checking mechanics are:**

There is a girl at the front desk. She got her role in the App. She has the bracelets with 2 colors, say yellow for Attendee and red for Speaker. The process goes as follows:

+ guest signs the message with his key in the App. The message looks something like this:
    ```
    {"role":"attendee", "ts": "2018-11-19T11:39:03.403Z"}
    ```

+ the App formes the QR code from the signed message, and the guest show the QR code to the girl at the front desk
+ the girl scans the QR code with her phone camera, using her App, and:

    * guest's role and ETH account are extracted from the signed message and being compared to the registry from the contract
    * if *match*, 
        
        - the App shows OK and the role (braclet color to be issued for the guest)
        - girl give the braclet to the guest. **Voila, the guest has been registered**.

    * if *failed*,

        - the App shows FAIL
        - the guest should no be registered
        - the girl should navigate the guest to the support deck for issue proceedings
        
+ all the process has been logged to the App server

**Since checkin closed:**

+ no Attendees can be registered
+ no Speakers can be registered

### Profit Distribution

Profit distribution must be executed right at the *[timestamp of profit distribution]*  (*17.00 14 December*).

In order to correctly count loosing Speaker's bids in rewards distribution, checked-in Speakers must be submitted by Organizer before calling the function.

For the sake of simplicity, we do not count costs explicitly in the contract. Costs are Orginizer's risk, and are accounted in her revenue share rate.

Profit Distribution rules are:
- \<Speaker's profit> =

  (\<total revenue from ticket auction> * \<speakers share of revenue (20%)>) *
  
  (\<total deposits of checked-in speakers> / \<total deposit of speakers>)

- \<Organizer's profit> =
  (\<total revenue from ticket auction> * \<Organizer share of revenue (80%)>) +
  \<total deposits of missed speakers>

- \<Missed Speaker loss> = her deposit
