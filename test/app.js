const wsserver = "localhost:8081";
var WebSocket = require ('ws');
// process.stdin.setEncoding ('utf8');
// var util = require('util');

ws1 = new WebSocket("ws://" + wsserver + "/Pero");
ws2 = new WebSocket("ws://" + wsserver + "/Ante");

ws1.onopen = function(e) {
  ws1.send ('{"command":"join"}');
}

ws1.onmessage = function (msg) {
    console.log (msg.data);
}

ws2.onopen = function(e) {
  ws1.send ('{"command":"join"}');
}

ws2.onmessage = function (msg) {
    //console.log (msg.data);
}

setTimeout(function() {
  ws1.send ('{"command":"deal"}');
}, 2000);

process.stdin.on('data', function (text) {

  if (text[0] == "e".charCodeAt(0)) {
    ws1.send ('{"command":"take"}');
    ws2.send ('{"command":"take"}');
  }

  if (text[0] == "d".charCodeAt(0)) {
    ws1.send ('{"command":"deal"}');
  }
});


//setTimeout (ws1.send ('{"command":"deal"}'), 5000);