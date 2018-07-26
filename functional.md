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
    3. Create event (can only organizer, 1.9) with following parameters:
        1. Start time
        2. End time
        3. Ticket price
        4. Tickets amount
        5. Event owner percent
        6. Speakers percent
        7. Array with speakers addresses
    4. Cancel event (can only event owner) - all collected ETH are sending back to participiants and no one more can sign up or checkin to this event
    5. Close event (can only event owner) - all colected ETH will be distributed between contract owner (1.6), event owner and speakers.
    6. Set owner percent (can only contract owner) - contract owner can set percent of collected ETH that he receive after each event
    7. Sign up - user pay ETH to the contract and receive ticket (token) - he should show it when he comes to event, otherwise he won't get back his participiant percent (if it doesn't equals to 0)
    8. Checkin - generates QR-code with current participiant Status app address and with token ID. When participiant comes to event, organizer from event owner account scans this code. Brought by token will be freezed and participiant's percent will be returned.
    9. Add organizer (can call only contract owner)

2. __ERC721 token modifications__

    1. Each token keeps event ID for wich was minted
    2. Each token keeps its freeze status
    3. Contract creator can freeze any account if he sees dangerous activity
    4. Main contract can freeze any token

3. __Auction types possible to use in this project (now I don't now which will be better)__

    1. Yankee auction - its a closed from other participants bidding. The winner who gives the highest price, receives the goods for the price that he set. Each participant sets his price only once. Auction contains two phases - submissions of offers and determination of the winner. If the product is single the winner only one but if its lot of goods wins not only person that gives the highest price (other goods are given in descending order of prices and offers)
    2. First price auction - its a closed auction. Participiants send their offers secretly, the winner is the person that gives the highest price. For goods he pays "first price" - his offer rate. 2/3 auctions in world are occur so.
    3. Second price auction - occurs like first price auction but winner pays second in rate offer amount.
    4. Direct auction (British) - seller sets minimal price and buyers express their offers increasing the price. All ofers are public. Wins person that offers the biggest price. This auction can be limited in time.