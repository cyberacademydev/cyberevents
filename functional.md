## Cyber Academy - functional

1. __Main contract__

    1. Get event data by it's ID:
        1. ID
        2. Start time
        3. End time
        4. Ticket price
        5. Tickets amount
        6. Collected ETH amount
        7. Event owner percent
        8. Speakers percent
        9. Event owner address
        10. Array with participiants addresses
        11. Array with speakers addresses
    2. Get upcoming events
    3. Create event (only organizer can, 1.9) with following parameters:
        1. Start time
        2. End time
        3. Ticket price
        4. Tickets amount
        5. Event owner percent
        6. Speakers percent
        7. Array with speakers addresses
    4. Cancel event (only event owner can) - all collected ETH are sending back to participiants and no one more can sign up or checkin to this event
    5. Close event (only event owner can) - all colected ETH will be distributed between contract owner (1.6), event owner and speakers.
    6. Set owner percent (only contract owner can) - contract owner can set percent of collected ETH that he receive after each event
    7. Sign up - user pay ETH to the contract and receive ticket (token) - he should show it when he comes to event, otherwise he won't get back his participant percent (cashback) (if it doesn't equals to 0)
    8. Checkin - generates QR-code with current participiant Status app address and with the token ID. When participant comes to the event, organizer from event owner account scans this code. Otherwise, the token will be freezed and participiant's percent will be returned.
    9. Add organizer (can call only contract owner)

2. __ERC721 token modifications__

    1. Each token keeps event ID for which was minted
    2. Each token keeps its freeze status
    3. Contract creator can freeze any account if he sees dangerous activity
    4. Main contract can freeze any token

3. __Auction types possible to use in this project (I don't know which will be better)__

    1. Yankee auction - It's a private bidding, participants can't see other bids. The winner who gives the highest price receives the prize for the price that he set. Each participant sets his price only once. Auction contains two phases - submissions of offers and determination of the winner. If there is only one prize, there is only one winner, but if there are many prizes, the highest bidder gets the most expensive prize, other prizes are given based on the offers, and the price of the prizes.
    2. First price auction - It's a closed auction. Participiants send their offers secretly, the winner is the person that gives the highest price. For the prize he pays "first price" - the price he offered. 2 put of 3 auctions in the world use this format.
    3. Second price auction - occurs like the first price auction but winner pays the amount of the second highest offer.
    4. Direct auction (British) - seller sets minimal price and buyers offer prices higher than the minimum. All offers are public. The person that offers the biggest price wins. This auction can have a time limit.