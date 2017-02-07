const _ = require('lodash');
const Trello = require('node-trello');

const token = process.env.TRELLO_TOKEN;
const apiKey = process.env.TRELLO_API_KEY;
const t = new Trello(apiKey, token);


// Prod URIs:
const boards = {
  Care: {
    name: 'Care',
    id: 'CBPPssjt',
    inbox: '55a92e737874e3e2b36bd82b',
    rejected: '5799e9ff1fc18aa4989c23d7',
  },
  Imagine: {
    name: 'Imagine',
    id: 'l1IAlCzO',
    inbox: '57d18d04537bb6086624c216',
    rejected: '57d18cfff617bee8262f94e9',
  },
  Conquer: {
    name: 'Conquer',
    id: 'pji1kHYk',
    inbox: '57d05fdf520de02a1c07f7b6',
    rejected: '57d05fd70e6ad807729ba3c8',
  },
  Engage: {
    name: 'Engage',
    id: '820KaDPs',
    inbox: '57d18c3c54a11e7fa1669923',
    rejected: '57d18c42aaefdd097ed3f901',
  },
  Universities: {
    name: 'Universities',
    id: 'ncqUVXzN',
    inbox: '57d188dbeabcaeb09c09321b',
    rejected: '57d188d4705c5772f2bf7daa',
  },
  Test: {
    name: 'Test',
    id: '579b614fd98e1f966d8b6a5a',
    inbox: '579b614fd98e1f966d8b6a5d',
    rejected: '579b614fd98e1f966d8b6a5c',
  },
};


// enable the user to run the script on a custom file
let targetBoard;
if (process.argv.length === 2) {
  throw new Error('Missing arguments. Script must be executed with at least one arg : Care / Imagine / Conquer / Engage / Universities / Test');
} else if (process.argv.length === 3) {
  targetBoard = _.capitalize(process.argv[2]);
  if (!Object.keys(boards).includes(targetBoard)) {
    throw new Error('Wrong arguments. Script must be executed with one arg of : Care / Imagine / Conquer / Engage / Universities / Test');
  }
} else {
  throw new Error('Too many arguments.');
}

const winston = require('winston');

winston.add(winston.transports.File, {
  filename: '/var/log/productbot.log',
  colorize: true,
  prettyPrint: true,
  timestamp: true,
});


const date = new Date(); // current date

// comments :
const comments = {
  template_error: 'Cette carte ne respecte pas le https://trello.com/c/XKfHDD26/886-template. Elle a été déplacée dans la colonne *rejected* pour le moment. Merci de la corriger avant de la réinsérer dans la colonne *Problème rencontré*. Cela améliorera grandement l\'éfficacité de ce board. \n\n Pour plus d\'informations sur le process, consulte le https://trello.com/c/VPB71ybt/282-readme. \n\nTu peux aussi consulter les https://trello.com/c/tiIZesaB/950-regles-de-traitement-des-feature-request-astuces-pour-ecrire-une-feature-request-qui-ira-rapidement-en-prod. \n\n--\n*Ceci est un message automatique du **Product Bot** ;)*',
  abandonWarning: 'Cette carte a l\'air abandonnée, elle sera archivée dans 10j si aucune activité n\'est reprise. \n\n#DeadRejectedCardWarning \n\n--\n*Ceci est un message automatique du **Product Bot** ;)*',
  archiveNotice: 'Cette carte n\'a pas évolué depuis le précédent message, elle est donc considérée comme obsolète et va être archivée. N\'hésite pas à la réouvrir et à intéragir dessus si ce n\'est pas ce que tu souhaites. \n\n--\n*Ceci est un message automatique du **Product Bot** ;)*',
};

function ping(card, callback) {
  t.get(`/1/cards/${card.id}/members`, (err, members) => {
    if (err) winston.log('error', err);
    const membersArray = [];
    _.forEach(members, (member) => {
      membersArray.push(member.username);
    });
    if (members.length > 0) {
      callback(`@${membersArray.join(', @')} :\n\n`);
    } else {
      callback('@edelans, @julien_faure, ');
    }
  });
}

function cleanInbox(board) {
  t.get(`/1/lists/${board.inbox}/cards`, (err, cards) => {
    let counter = 0;
    if (err) {
      winston.log(`error in board ${board.name}`, err);
    }
    _.forEach(cards, (card) => {
      const cardId = card.id;
      if (!_.includes(card.name.toLowerCase(), 'template') && !_.includes(card.name.toLowerCase(), 'readme')) {
        if (!_.includes(card.desc, 'Problème rencontré')) {
          counter += 1;
          ping(card, (toPing) => {
            const comment = toPing + comments.template_error;
            setTimeout(() => {
              // to avoid hitting rate limit
              t.post(`/1/cards/${cardId}/actions/comments`, { text: comment }, (err1) => {
                if (err1) winston.log(`error in board ${board.name}`, err1);
                t.put(`/1/cards/${cardId}/idList`, { value: board.rejected }, (err2) => {
                  if (err2) winston.log(`error in board ${board.name}`, err2);
                });
              });
            }, 100);
          });
        }
      }
    });
    if (counter > 0) {
      winston.log('info', `Product bot script moved ${counter} cards to the rejected column of board ${board.name}`, { rejected: counter });
    }
  });
}


function cleanRejected(board) {
  t.get(`/1/lists/${board.rejected}/cards`, (err, cards) => {
    let warningCounter = 0;
    let archiveCounter = 0;
    if (err) {
      winston.log(`error in board ${board.name}`, err);
    }
    _.forEach(cards, (card) => {
      const cardId = card.id;

      if (Date.parse(card.dateLastActivity) < (date.getTime() - (10 * 24 * 60 * 60 * 1000))) {
        t.get(`/1/cards/${cardId}/actions`, { filter: 'commentCard' }, (err3, cardComments) => {
          if (cardComments[0]) {
            const lastComment = cardComments[0].data.text;
            if (_.includes(lastComment, '#DeadRejectedCardWarning')) {
              // comment and archive the card
              archiveCounter += 1;
              ping(card, (toPing) => {
                const comment = toPing + comments.archiveNotice;
                setTimeout(() => {
                  // to avoid hitting rate limit
                  t.post(`/1/cards/${cardId}/actions/comments`, { text: comment }, (err1) => {
                    if (err1) winston.log(`error in board ${board.name}`, err1);
                    t.put(`/1/cards/${cardId}/closed`, { value: 'true' }, (err2) => {
                      if (err2) winston.log(`error in board ${board.name}`, err2);
                    });
                  });
                }, 100);
              });
            } else {
              // issue warning
              warningCounter += 1;
              ping(card, (toPing) => {
                const comment = toPing + comments.abandonWarning;
                setTimeout(() => {
                  // to avoid hitting rate limit
                  t.post(`/1/cards/${cardId}/actions/comments`, { text: comment }, (err1) => {
                    if (err1) winston.log(`error in board ${board.name}`, err1);
                  });
                }, 100);
              });
            }
          }
        });
      }
    });
    if (warningCounter > 0 || archiveCounter > 0) {
      winston.log('info', `Product bot daily script warned ${warningCounter} cards and archived ${archiveCounter} others`);
    }
  });
}


winston.log('info', 'Product bot script started ');


cleanInbox(boards[targetBoard]);
cleanRejected(boards[targetBoard]);
