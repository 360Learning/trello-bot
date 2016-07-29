var _ = require('lodash');
var Trello = require('node-trello');
var t = new Trello('81f3812822bb14b2bf02ce18c5162f4e', '0fc93c1353a9d53731d7a24161642b3d216836e0ae078e60345ada4eb1a86b16');

var winston = require('winston');
winston.add(winston.transports.File, {
  filename: 'productbot.log',
  colorize: true,
  prettyPrint: true,
  timestamp: true
});

// Prod URIs:
var rejectedListId = '5799e9ff1fc18aa4989c23d7';
var inboxListId = '55a92e737874e3e2b36bd82b';

// Test URIs:
// var rejectedListId = '579b614fd98e1f966d8b6a5c';
// var inboxListId = '579b614fd98e1f966d8b6a5d';

// comments :
var comments = {
  'template_error': "Cette carte ne respecte pas le https://trello.com/c/x1maAmzK/144-template. Elle a été déplacée dans la colonne *rejected* pour le moment. Merci de la corriger avant de la réinsérer dans la colonne *Problème rencontré*. Cela améliorera grandement l'éfficacité de ce board. \n\n Pour plus d'informations sur le process, consulte le https://trello.com/c/sPshMymS/1-readme. \n\nTu peux aussi consulter les https://trello.com/c/tBB6lLsl/176-regles-de-traitement-des-feature-request-astuces-pour-ecrire-une-feature-request-qui-ira-rapidement-en-prod. \n\n--\n*Ceci est un message automatique du **Product Bot** ;)*"
};

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

winston.log('info', 'Product bot script started ');

t.get('/1/lists/' + inboxListId + '/cards', function(err, cards) {
  var counter = 0;
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
          t.post('/1/cards/' + cardId + '/actions/comments', {'text': comment}, function(err1) {
            if (err) winston.log('error', err1);
            t.put('/1/cards/' + cardId + '/idList', {'value': rejectedListId}, function(err2) {
              if (err) winston.log('error', err2);
            });
          });
        }, 1000);
      });
    }
  });
  if (counter > 0) {
    winston.log('info', 'Product bot script moved ' + counter + ' cards to the rejected column', { rejected: counter });
  }
});
