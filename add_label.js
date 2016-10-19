var _ = require('lodash');
var Trello = require('node-trello');

var token   = process.env.TRELLO_TOKEN;
var apiKey = process.env.TRELLO_API_KEY;
var t = new Trello(apiKey, token);

var winston = require('winston');
winston.add(winston.transports.File, {
  filename: '/var/log/productbot.log',
  colorize: true,
  prettyPrint: true,
  timestamp: true
});

// Prod URIs:
// inbox, rejected, reflexion
var listIDs = ['55a92e737874e3e2b36bd82b', '5799e9ff1fc18aa4989c23d7'];

// id of label to add
// here : label "Check Seb" (no color)
var labelToAdd = {value: '58073a6184e677fd36ea68be'};


function addSebLabel(listID) {
  t.get('/1/lists/' + listID + '/cards', function(err, cards) {
    if (err) winston.log(err);
    _.forEach(cards, function(card) {
      var cardId = card.id;
      setTimeout(function() {
        // to avoid hitting rate limit
        t.post('/1/cards/' + cardId + '/idLabels', labelToAdd, function(err2) {
          if (err2) winston.log(err);
        });
      }, 500);
    });
  });
}


winston.log('info', 'Add check Seb label script started ');

_.forEach(listIDs, function(listID) {
  addSebLabel(listID);
});
