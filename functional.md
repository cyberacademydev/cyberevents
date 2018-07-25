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
    3. Create event (can call only organizer, 1.9) with following parameters:
        1. Start time
        2. End time
        3. Ticket price
        4. Tickets amount
        5. Event owner percent
        6. Speakers percent
        7. Array with speakers addresses
    4. Cancel event (can only event owner) - all collected ETH are sending back to participiants and no one more can sign up or checkin to this event
    5. Close event (can only event owner) - all colected ETH will be distributed between contract owner (1.6), event owner and speakers.
    6. Set owner percent (can only contract owner) - contract owner can set percent of collected ETH that he will receive after each event
    7. Sign up - user pay ETH to the contract and receive ticket (token) - he should show it when he comes to event, otherwise he will'nt get back his participiant percent (if it doesn't equals to 0)
    8. Checkin - generates QR-code with current participiant Status app address and with token ID. When participiant comes to event, organizer from event owner account scan this code. Brought by token will be freezed and participiant's percent will be returned.
    9. Add organizer (can call only contract owner)
2. __ERC721 token modifications__
    1. Each token keeps event ID for wich was minted
    2. Each token keeps it's freeze status
    3. Contract creator can freeze any account if he see dangerous activity
    4. Main contract can freeze any token