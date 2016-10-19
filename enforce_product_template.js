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
var boards = [
  {
    'name': 'Care',
    'inbox': '55a92e737874e3e2b36bd82b',
    'rejected': '5799e9ff1fc18aa4989c23d7'
  },
  {
    'name': 'Imagine',
    'inbox': '57d18d04537bb6086624c216',
    'rejected': '57d18c86d58117d98b66352a'
  },
  {
    'name': 'Conquer',
    'inbox': '57d05fdf520de02a1c07f7b6',
    'rejected': '57d05fd70e6ad807729ba3c8'
  },
  {
    'name': 'Engage',
    'inbox': '57d18c3c54a11e7fa1669923',
    'rejected': '57d18c42aaefdd097ed3f901'
  },
  {
    'name': 'Universities',
    'inbox': '579b614fd98e1f966d8b6a5d',
    'rejected': '579b614fd98e1f966d8b6a5c'
  }
];

// Test URIs:
// boards = [
//   {
//     'name': 'Test board',
//     'inbox': '579b614fd98e1f966d8b6a5d',
//     'rejected': '579b614fd98e1f966d8b6a5c'
//   }
// ];


var date = new Date(); // current date

// comments :
var comments = {
  'template_error': 'Cette carte ne respecte pas le https://trello.com/c/XKfHDD26/886-template. Elle a été déplacée dans la colonne *rejected* pour le moment. Merci de la corriger avant de la réinsérer dans la colonne *Problème rencontré*. Cela améliorera grandement l\'éfficacité de ce board. \n\n Pour plus d\'informations sur le process, consulte le https://trello.com/c/VPB71ybt/282-readme. \n\nTu peux aussi consulter les https://trello.com/c/tiIZesaB/950-regles-de-traitement-des-feature-request-astuces-pour-ecrire-une-feature-request-qui-ira-rapidement-en-prod. \n\n--\n*Ceci est un message automatique du **Product Bot** ;)*',
  'abandonWarning': 'Cette carte a l\'air abandonnée, elle sera archivée dans 10j si aucune activité n\'est reprise. \n\n#DeadRejectedCardWarning \n\n--\n*Ceci est un message automatique du **Product Bot** ;)*',
  'archiveNotice': 'Cette carte n\'a pas évolué depuis le précédent message, elle est donc considérée comme obsolète et va être archivée. N\'hésite pas à la réouvrir et à intéragir dessus si ce n\'est pas ce que tu souhaites. \n\n--\n*Ceci est un message automatique du **Product Bot** ;)*'
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
      callback('@edelans, @julien_faure');
    }
  });
}

function cleanInbox(board) {
  t.get('/1/lists/' + board.inbox + '/cards', function(err, cards) {
    var counter = 0;
    if (err) {
      winston.log('error in board ' + board.name, err);
    }
    _.forEach(cards, function(card) {
      var cardId = card.id;
      if (!_.includes(card.name.toLowerCase(), 'template') && !_.includes(card.name.toLowerCase(), 'readme')) {
        if (!_.includes(card.desc, 'Problème rencontré')) {
          counter += 1;
          ping(card, function(toPing) {
            var comment = toPing + comments.template_error;
            setTimeout(function() {
              // to avoid hitting rate limit
              t.post('/1/cards/' + cardId + '/actions/comments', {'text': comment}, function(err1) {
                if (err) winston.log('error in board ' + board.name, err1);
                t.put('/1/cards/' + cardId + '/idList', {'value': board.rejected}, function(err2) {
                  if (err) winston.log('error in board ' + board.name, err2);
                });
              });
            }, 500);
          });
        }
      }
    });
    if (counter > 0) {
      winston.log('info', 'Product bot script moved ' + counter + ' cards to the rejected column of board ' + board.name, { rejected: counter });
    }
  });
}


function cleanRejected(board) {
  t.get('/1/lists/' + board.rejected + '/cards', function(err, cards) {
    var warningCounter = 0;
    var archiveCounter = 0;
    if (err) {
      winston.log('error in board ' + board.name, err);
    }
    _.forEach(cards, function(card) {
      var cardId = card.id;

      if ( Date.parse(card.dateLastActivity) < (date.getTime() - (10 * 24 * 60 * 60 * 1000) )) {
        t.get('/1/cards/' + cardId + '/actions', { filter: 'commentCard' }, function(err3, cardComments) {
          var lastComment = cardComments[0].data.text;
          if (_.includes(lastComment, '#DeadRejectedCardWarning')) {
            // comment and archive the card
            archiveCounter += 1;
            ping(card, function(toPing) {
              var comment = toPing + comments.archiveNotice;
              setTimeout(function() {
                // to avoid hitting rate limit
                t.post('/1/cards/' + cardId + '/actions/comments', {'text': comment}, function(err1) {
                  if (err) winston.log('error in board ' + board.name, err1);
                  t.put('/1/cards/' + cardId + '/closed', {'value': 'true'}, function(err2) {
                    if (err) winston.log('error in board ' + board.name, err2);
                  });
                });
              }, 500);
            });
          } else {
            // issue warning
            warningCounter += 1;
            ping(card, function(toPing) {
              var comment = toPing + comments.abandonWarning;
              setTimeout(function() {
                // to avoid hitting rate limit
                t.post('/1/cards/' + cardId + '/actions/comments', {'text': comment}, function(err1) {
                  if (err) winston.log('error in board ' + board.name, err1);
                });
              }, 500);
            });
          }
        });
      }
    });
    if (warningCounter > 0 || archiveCounter > 0) {
      winston.log('info', 'Product bot daily script warned ' + warningCounter + ' cards and archived ' + archiveCounter + ' others');
    }
  });
}


winston.log('info', 'Product bot script started ');

_.forEach(boards, function(board) {
  cleanInbox(board);
  cleanRejected(board);
});
