const Trello = require('node-trello');
const winston = require('winston');

const token = process.env.TRELLO_TOKEN;
const apiKey = process.env.TRELLO_API_KEY;
const t = new Trello(apiKey, token);

winston.add(winston.transports.File, {
  filename: '/var/log/productbot.log',
  colorize: true,
  prettyPrint: true,
  timestamp: true,
});

// Prod URIs:
// inbox, rejected, reflexion
const listIDsToLabelize = ['55a92e737874e3e2b36bd82b'];

// id of label to add
// here : label "Check Seb" (no color)
// problem : label id depends on the board...
// same label name on different boards ? => different label ids
const labelToAdd = { value: '58073a6184e677fd36ea68be' };

function pollTrelloAPI(path) {
  return new Promise((resolve, reject) => {
    t.get(path, (err, data) => {
      if (err) {
        winston.log('error', err);
        reject(err);
      } else {
        // winston.log('info',data)
        resolve(data);
      }
    });
  });
}

function postTrelloAPI(path, arg) {
  return new Promise((resolve, reject) => {
    t.post(path, arg, (err) => {
      if (err) {
        winston.log('error', err);
        reject(err);
      } else {
        winston.log('info', 'successfully post to trello api');
        resolve('done');
      }
    });
  });
}

function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms); // (A)
  });
}

function addSebLabel(cardIDs) {
  // winston.log('info', 'entering addSebLabel');
  if (cardIDs.length === 0) {
    winston.log('info', 'no card to label');
    return 'no card to label';
  }
  winston.log('info', `in addSebLabel cardIDs is ${cardIDs}`);
  let sequence = Promise.resolve();
  cardIDs.forEach((cardID) => {
    // Chain one computation onto the sequence
    sequence = sequence
      .then(delay(100))
      .then(() => postTrelloAPI(`/1/cards/${cardID}/idLabels`, labelToAdd))
      .then(() => winston.log('info', `added CheckSeb label to card ${cardID}`));
  });

  // This will resolve after the entire chain is resolved
  return sequence;
}

function hasNotLabel(card) {
  return !card.idLabels.includes(labelToAdd.value);
}

function getCardsIDs(listID) {
  return pollTrelloAPI(`/1/lists/${listID}/cards`)
  .then(cards => cards.filter(hasNotLabel).map(card => card.id))
  .catch(winston.log);
}


function getAllCardsIDs(listIDs) {
  let sequence = Promise.resolve([]);
  let cardIDs = [];

  listIDs.forEach((listID) => {
    // Chain one computation onto the sequence
    sequence = sequence
      .then(delay(100))
      .then(() => getCardsIDs(listID))
      .then((result) => {
        winston.log('info', `intermediate cardsIDs is ${result}`);
        cardIDs = cardIDs.concat(result);
        return cardIDs;
      });
  });

  // This will resolve after the entire chain is resolved
  return sequence.then(Promise.resolve(cardIDs));
}


winston.log('info', 'Add check Seb label script started ');

getAllCardsIDs(listIDsToLabelize)
  .then(addSebLabel)
  .catch(winston.log);
