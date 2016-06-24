var Trello = require("node-trello");
var t = new Trello("<your key>", "<token>");

t.get("/1/members/me", function(err, data) {
  if (err) throw err;
  console.log(data);
});

// URL arguments are passed in as an object.
t.get("/1/members/me", { cards: "open" }, function(err, data) {
  if (err) throw err;
  console.log(data);
});
