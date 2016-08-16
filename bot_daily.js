var _ = require('lodash');
var Trello = require('node-trello');
var t = new Trello('81f3812822bb14b2bf02ce18c5162f4e', '0fc93c1353a9d53731d7a24161642b3d216836e0ae078e60345ada4eb1a86b16');

var winston = require('winston');
winston.add(winston.transports.File, {
  filename: '/var/log/productbot.log',
  colorize: true,
  prettyPrint: true,
  timestamp: true
});

// Prod URIs:
var rejectedListId = '5799e9ff1fc18aa4989c23d7';
// var inboxListId = '55a92e737874e3e2b36bd82b';

// Test URIs:
// var rejectedListId = '579b614fd98e1f966d8b6a5c';
// var inboxListId = '579b614fd98e1f966d8b6a5d';

// comments :
var comments = {};

function ping(card, callback) {
  t.get('/1/cards/' + card.id + '/members', function(err, members) {
    if (err) winston.log('error', err);
    var membersArray = [];
    _.forEach(members, function(member) {
      membersArray.push(member.username);
    });
    if (members.length > 0) {
      callback('@' + membersArray.join(', @') + ' :\n\n');
    } else {
      callback('');
    }
  });
}

winston.log('info', 'Product bot daily script started ');

t.get('/1/lists/' + rejectedListId + '/cards', function(err, cards) {
  var warningCounter = 0;
  var archiveCounter = 0;
  if (err) {
    winston.log('error', err);
  }
  _.forEach(cards, function(card) {
    var cardId = card.id;
    if (!_.includes(card.desc, 'Problème rencontré')) {
      counter += 1;
      ping(card, function(toPing) {
        var comment = toPing + comments.template_error;
        setTimeout(function() {
          // to avoid hitting rate limit
          t.post('/1/cards/' + cardId + '/actions/comments', {'text': comment}, function(err1) {
            if (err) winston.log('error', err1);
            t.put('/1/cards/' + cardId + '/idList', {'value': rejectedListId}, function(err2) {
              if (err) winston.log('error', err2);
            });
          });
        }, 500);
      });
    }
  });
  if (warningCounter > 0 || archiveCounter > 0) {
    winston.log('info', 'Product bot daily script warned ' + warningCounter + ' cards and archived ' + archiveCounter + ' others');
  }
});
