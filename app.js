const express = require('express');
const app = express();
const router = express.Router();

var game = require('./game');
var params = require('./cards/params')

const fs = require('fs');
var options = {
    key: fs.readFileSync('/etc/nginx/ssl/nginx.key'),
    cert: fs.readFileSync('/etc/nginx/ssl/nginx.crt')
};
const https = require('https');
var httpsserver = https.createServer(options, app);

router.use(function(req, res, next) {
    if (!req.url.startsWith("/cards")) req.url = "/cards" + req.url;
    //console.log (req.url);
    next();
})

router.get('/cards/deal', function(req, res) {
    game.deal();
    res.end();
})

router.get('/cards', function(req, res) {
    res.sendFile("./cards/index.html", {
        root: __dirname
    });
})

router.get('/cards/*.gif', function(req, res) {
    res.sendFile("./static" + req.url.replace("/cards", ""), {
        root: __dirname
    });
})

app.use(express.static('cards'));
app.use(express.static('cards/jquery-ui'));
app.use(express.static('static'));
app.use(express.static('.'));
app.use('/', router);

//httpsserver.listen (9002);

var server = httpsserver.listen(params.port, function() {
    console.log('http server running at ', server.address().port, ' ', server.address().address);
    var webSocketServer = new(require('ws')).Server({
            server: server
        }),
        webSockets = {};
    console.log('Web Socket server running on same port');

    webSocketServer.on('connection', function(webSocket, req) {
        console.log("connecting:" + req.url.substr(1));
        var userID = req.url.substr(1).replace("crdsocket/", "");
        webSockets[userID] = webSocket;
        console.log("connected:" + userID);

        webSocket.on('message', function(message) {
            var cmd = JSON.parse(message);
            console.log(cmd.command);
            if (cmd.command == 'join') {
                game.joined(userID);
            } else if (cmd.command == 'deal') {
                game.deal();
            } else if (cmd.command == 'discard') {
                game.discarded(userID, cmd.i);
            } else if (cmd.command == 'takeOne') {
                game.takeOne(userID);
            } else if (cmd.command == 'resetTotals') {
                game.resetTotals();
            } else if (cmd.command == 'take') {
                game.take(userID);
            }
        });

        webSocket.on('close', function() {
            delete webSockets[userID];
            game.left(userID);
            console.log('deleted: ' + userID);
        })
    })

    exports.webSockets = webSockets;
});


if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}