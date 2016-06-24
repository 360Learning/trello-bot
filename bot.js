var _ = require('lodash');
var Trello = require("node-trello");
var t = new Trello("81f3812822bb14b2bf02ce18c5162f4e", "0fc93c1353a9d53731d7a24161642b3d216836e0ae078e60345ada4eb1a86b16");

console.log("hello !");
t.get("/1/lists/55a92e737874e3e2b36bd82b/cards", function(err, cards) {
// t.get("/1/member/me/boards", function(err, data) {
  if (err) throw err;
  _.forEach(cards, function(card){
    if (!_.includes(card.desc, 'Problème rencontré')) {
      console.log('not ok');
    } else {
      console.log('ok');
    }
  });
});
