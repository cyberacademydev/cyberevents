const Ticket = artifacts.require('Ticket');
const Event = artifacts.require('Event');

module.exports = function(deployer) {
  deployer.deploy(Ticket).then(function() {
    return deployer.deploy(Event, Ticket.address);
  });
};
