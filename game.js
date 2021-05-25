var app = require('./app');
var deck = [];
var colors = ['clubs', 'diamonds', 'hearts', 'spades'];
var dealer = 0;
var hands = [];
var taken = [];
var totals = [0, 0, 0, 0];
var results = [];
var i = 0;
var timerVariable = null;
var seconds = 0;
var paused = false;

function timer() {
    if (!paused) {
        seconds++;
        sendToAll('{"command" : "time", "seconds" : "' + seconds + '"}');
    }
}

function findPlayer(playerName) {
    return playerName == Object.keys(app.webSockets)[0] ? 0 : 1;
}

function nextCard(userID) {
    hands[findPlayer(userID)][i] = 1;
    var json = '{"command":"card", "name":"' + userID + '", "iCard":' + i + '}';
    sendToAll(json);
    i++;
}
function deal() {
    deck = [];
    i = 0;
    for (var color = 0; color < 4; color++) {
        for (var card = 1; card <= 13; card++) {
            deck[i] = {
                color: colors[color],
                value: card
            };
            i++;
        }
    }
    var a, b, pom;
    for (i = 0; i < 100; i++) {
        a = (Math.floor(Math.random() * 52));
        b = (Math.floor(Math.random() * 52));
        pom = deck[a];
        deck[a] = deck[b];
        deck[b] = pom;
    }
    hands = [];
    hands[0] = {};
    hands[1] = {};
    taken[0] = 0;
    taken[1] = 0;
    for (var userID in app.webSockets) {
        user = findPlayer(userID);
        results[user].winning = 0;
    }
    sendToAll('{"command":"reset"}');
    for (i = 51; i >= 0; i--) {
        var json = '{"command":"init", "iCard":"' + i + '", "card":' + JSON.stringify(deck[i]) + '}';
        sendToAll(json);
    }
    // deal initial cards
    setTimeout(function () {
        i = 0;
        for (var j = 0; j < 5; j++) {
            for (var userID in app.webSockets) {
                nextCard(userID);
            }
        }
        for (var userID in app.webSockets) {
            rearrange(userID);
        }
    }, 500);
    nextDealer();
    //connection.send ('{"command":"deck", "deck":' + JSON.stringify(deck) + '}');
}
function countUsers() {
    console.log('users: ', Object.keys(app.webSockets).length);
    return Object.keys(app.webSockets).length;
}
function resetTotals() {
    var user;
    for (var userID in app.webSockets) {
        user = findPlayer(userID);
        totals[user] = 0;
        results[user].winning = 0;
        results[user].total = 0;
        results[user].score = "";
        sendToAll('{"command":"result", "name":"' + userID + '", "result":' + JSON.stringify(results[findPlayer(userID)]) + '}');
    }
}
function joined(name) {
    var user = findPlayer(name);
    for (var userID in app.webSockets) {
        sendToAll('{"command":"joined", "name":"' + userID + '"}');
        results[user] = {};
    }
    countUsers();
    nextDealer();
}
function rearrange(name) {
    var json = '{"command":"rearrange", "name":"' + name + '"}';
    sendToAll(json);
}
function nextDealer() {
    sendToAll('{"command":"dealer", "name":"' + Object.keys(app.webSockets)[dealer] + '"}');
    dealer = (dealer + 1) % Object.keys(app.webSockets).length;
}
function sendToAll(command) {
    for (var userID in app.webSockets) {
        app.webSockets[userID].send(command);
    }
}
function discarded(name, i) {
    delete hands[findPlayer(name)][i];
    sendToAll('{"command":"discarded", "name":"' + name + '", "iCard":' + i + '}');
    rearrange(name);
}
function left(userID) {
    countUsers();
}
function take(userID) {
    var user = findPlayer(userID);
    taken[user] = 1;
    for (var j = Object.keys(hands[user]).length; j < 5; j++) {
        nextCard(userID);
    }
    rearrange(userID);
    if (taken[1 - user] == 1 || countUsers() == 1) {
        sendToAll('{"command":"end"}');
        console.log(totals);
        for (var userID_1 in app.webSockets) {
            user = findPlayer(userID_1);
            results[user] = evaluate(userID_1);
        }
        winner();
        for (var userID_2 in app.webSockets) {
            sendToAll('{"command":"result", "name":"' + userID_2 + '", "result":' + JSON.stringify(results[findPlayer(userID_2)]) + '}');
        }
    }
}
function takeOne(userID) {
    nextCard(userID);
    rearrange(userID);
}
function compareCards(a, b) {
    return a.value - b.value;
}
function maxOf(a, b) {
    return a > b ? a : b;
}
function evaluate(userID) {
    console.log("Evaluate", userID);
    var user = findPlayer(userID);
    var hand = [];
    var i = 0;
    for (var c in hands[user]) {
        hand[i] = deck[parseInt(c)];
        if (hand[i].value == 1) hand[i].value = 14;
        i++;
    }

    hand.sort(compareCards);

    var result = 0, v;
    var prev = {
        color: 'none',
        value: -2
    };
    var sameCount = 1, sameColor = 1, sequence = 1, pairCard = -1,
        highCard = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        results = ['Nothing', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'];

    for (i = 0; i < 5; i++) {
        v = hand[i].value;

        if (v != prev.value) {
            sameCount = 1;
            if (v == prev.value + 1
                || sequence == 4 && i == 4 && v == 14 && prev.value == 5) { // 2, 3, 4, 5 and then Ace
                sequence++;
            } else {
                sequence = 1;
            }
        } else {
            sameCount++;
        }

        if (hand[i].color == prev.color) {
            sameColor++;
        } else {
            sameColor = 1;
        }

        prev = hand[i];

        if (sameCount == 2) {
            if (result == 0) { // First pair
                highCard[1 + 5] = v;
                pairCard = v;
                result = 1;
            } else if (result == 1) { // Second pair
                highCard[2 + 5] = maxOf(highCard[1 + 5], v);
                result = 2;
            } else if (result == 3) { // Pair after a triple
                highCard[1 + 5] = v;
                result = 6;
            }
        } else if (sameCount == 3) {
            highCard[3 + 5] = v;
            if (result == 0) {
                result = 3;
            } else if (result == 2) {
                highCard[6 + 5] = v;
                result = 6;
            } else if (result == 1 && pairCard != v) {
                highCard[6 + 5] = v;
                result = 6;
            } else if (result == 1 && pairCard == v) {
                result = 3;
            }
        } else if (sameCount == 4) {
            highCard[4 + 5] = v;
            result = 7;
        }
    }
    if (sequence == 5 && sameColor == 5) {
        highCard[8 + 5] = v;
        result = 8;
    }
    if (result < 4 && sequence == 5) {
        highCard[4 + 5] = v;
        result = 4;
    }
    if (result < 5 && sameColor == 5) {
        highCard[5 + 5] = v;
        result = 5;
    }

    // find singles
    for (i = 0; i <= 4; i++) {
        if (hand[i].value == 1) {
            hand[i].value = 14;
        }
    }
    hand.sort(compareCards);
    for (i = 0; i <= 4; i++) {
        highCard[i] = hand[i].value;
    }

    // var k = 4;
    // if (hand[4] != hand[3])
    //     highCard[k--] = hand[4].value == 1 ? 14 : 1;
    // for (i = 3; i > 0; i--) {
    //     if (hand[i] != hand[i - 1] && hand[i] != hand[i + 1])
    //         highCard[k--] = hand[i].value == 1 ? 14 : 1;
    // }
    // if (hand[1] != hand[0])
    //     highCard[k--] = hand[0].value == 1 ? 14 : 1;


    return {
        name: userID,
        scoreNum: result,
        highCard: highCard,
        score: results[result],
        total: totals[user],
        winning: 0
    };
}

function compareResults(a, b) {
    console.log(a.scoreNum, a.score, b.scoreNum, b.score);
    console.log(a.highCard);
    console.log(b.highCard);
    if (a.scoreNum > b.scoreNum) {
        return -1;
    } else if (a.scorenum < b.scoreNum) {
        return 1;
    } else {
        for (var i_1 = a.highCard.length - 1; i_1 >= 0; i_1--) {
            if (a.highCard[i_1] > b.highCard[i_1]) {
                return -1;
            } else if (a.highCard[i_1] < b.highCard[i_1]) {
                return 1;
            }
        }
    }
    return 0;
}

function winner() {
    var tempresults = results.slice();
    tempresults.sort(compareResults);
    console.log(tempresults);
    var user = findPlayer(tempresults[0].name);
    totals[user]++;
    results[user].winning = 1;
    results[user].total++;
}

function time(t) {
    if (t == '0') {
        seconds = 0;
        if (!timerVariable) timerVariable = setInterval(timer, 1000);
        paused = false;
    } else if (t == '1') {
        window.clearInterval(timerVariable);
    } else if (t == '2') {
        paused = !paused;
    }
}

// exports
exports.deal = deal;
exports.joined = joined;
exports.discarded = discarded;
exports.left = left;
exports.take = take;
exports.takeOne = takeOne;
exports.resetTotals = resetTotals;
exports.time = time;
