declare var require:  Require;
declare var exports: any;

var app = require('./app');
var deck = [];
var colors = ['clubs', 'diamonds', 'hearts', 'spades'];
var dealer = 0;
var hands = [];
var taken = [];
var totals = [0, 0, 0, 0];
var results = [];
var i = 0;

function findPlayer(playerName) {
    return playerName == Object.keys(app.webSockets)[0] ? 0 : 1;
}

function nextCard(userID) {
    hands[findPlayer(userID)][i] = 1;
    let json = '{"command":"card", "name":"' + userID + '", "iCard":' + i + '}';
    sendToAll(json);
    i++;
}

function deal() {
    deck = [];
    i = 0;
    for (let color = 0; color < 4; color++) {
        for (let card = 1; card <= 13; card++) {
            deck[i] = {
                color: colors[color],
                value: card
            };
            i++;
        }
    }
    let a, b, pom;
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
    sendToAll('{"command":"reset"}');

    for (i = 51; i >= 0; i--) {
        let json = '{"command":"init", "iCard":"' + i + '", "card":' + JSON.stringify(deck[i]) + '}';
        sendToAll(json);
    }

    // deal initial cards
    setTimeout(function() {
        i = 0;
        for (let j = 0; j < 5; j++) {
            for (let userID in app.webSockets) {
                nextCard(userID);
            }
        }
        for (let userID in app.webSockets) {
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
    let user;    
    for (let userID in app.webSockets) {
        user = findPlayer(userID);
        totals[user] = 0;
        results[user].winning = 0;
        results[user].total = 0;
        results[user].score = "";
        sendToAll('{"command":"result", "name":"' + userID + '", "result":' + JSON.stringify(results[findPlayer(userID)]) + '}');
    }
}

function joined(name) {
    let user = findPlayer(name);
    for (let userID in app.webSockets) {
        sendToAll('{"command":"joined", "name":"' + userID + '"}');
    }
    countUsers();
    nextDealer();
}

function rearrange(name) {
    let json = '{"command":"rearrange", "name":"' + name + '"}';
    sendToAll(json);
}

function nextDealer() {
    sendToAll('{"command":"dealer", "name":"' + Object.keys(app.webSockets)[dealer] + '"}');
    dealer = (dealer + 1) % Object.keys(app.webSockets).length;
}

function sendToAll(command) {
    for (let userID in app.webSockets) {
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
    let user = findPlayer(userID);
    taken[user] = 1;
    for (let j = Object.keys(hands[user]).length; j < 5; j++) {
        nextCard(userID);
    }
    rearrange(userID);
    if (taken[1 - user] == 1 || countUsers() == 1) {
        sendToAll('{"command":"end"}');
        console.log (totals);
        for (let userID in app.webSockets) {
            user = findPlayer(userID);
            results[user] = evaluate(userID);
        }
        console.log (totals);
        winner();
        console.log (totals);
        for (let userID in app.webSockets) {
            sendToAll('{"command":"result", "name":"' + userID + '", "result":' + JSON.stringify(results[findPlayer(userID)]) + '}');
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
    console.log ("Evaluate", userID);
    let user = findPlayer(userID);
    let hand = [];
    let i = 0;
    for (let c in hands[user]) {
        hand[i++] = deck[parseInt(c)];
    }
    console.log("unsorted", hand);
    hand.sort(compareCards);
    console.log("sorted", hand);

    let result = 0,
        v;
    let prev = {
        color: 'none',
        value: -2
    };
    let sameCount = 1,
        sameColor = 1,
        sequence = 1,
        pairCard = -1,
        highCard = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        results = ['Nothing', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'];
    
    for (i = 0; i < 5; i++) {
        v = hand[i].value;
        if (v != prev.value) {
            sameCount = 1;
            if (v == prev.value + 1 || prev.value == 13 && v == 1) {
                sequence++;
            } else {
                sequence = 1;
            }
        } else {
            sameCount++;
        }
        
        if (v == 1) v = 14;

        if (hand[i].color == prev.color) {
            sameColor++;
        } else {
            sameColor = 1;
        }

        prev = hand[i];
        if (sameCount == 2) {
            if (result == 0) {
                highCard[1+5] = v;
                pairCard = v;
                result = 1;
            } else if (result == 1) {
                highCard[2+5] = maxOf(highCard[1+5], v)
                result = 2;
            } else if (result == 3) {
                highCard[1+5] = v;
                result = 6;
            }
        } else if (sameCount == 3) {
            highCard[3+5] = v;
            if (result == 0) result = 3;
            else if (result == 1 && pairCard != v) result = 6;
            else if (result == 1 && pairCard == v) result = 3;
        } else if (sameCount == 4) {
            highCard[4+5] = v;
            result = 7;
        }
    }
    if (sequence == 5 && sameColor == 5) result = 8;
    if (result < 4 && sequence == 5) result = 4;
    if (result < 5 && sameColor == 5) result = 5;

    // find singles
    let k = 4;
    if (hand[4] != hand[3]) highCard[k--] = hand[4].value == 1 ? 14 : 1;
    for (i = 3; i > 0; i--) {
        if (hand[i] != hand[i - 1] && hand[i] != hand[i + 1]) highCard[k--] = hand[i].value == 1 ? 14 : 1;
    }
    if (hand[1] != hand[0]) highCard[k--] = hand[0].value == 1 ? 14 : 1;

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
    if (a.scoreNum > b.scoreNum) {
        return -1;
    } else if (a.scorenum < b.scoreNum) {
        return 1;
    } else {
        for (let i = a.highCard.length -1 ; i >= 0; i--) {
            if (a.highCard[i] > b.highCard[i]) {
                return -1;
            } else if (a.highCard[i] < b.highCard[i]) {
                return 1;
            }
        }
    }
    return 0;
}

function winner() {
    let tempresults = results.slice();
    tempresults.sort(compareResults);
    let user = findPlayer(tempresults[0].name);
    totals[user]++;
    results[user].winning = 1;
    results[user].total++;
}
// exports
exports.deal = deal;
exports.joined = joined;
exports.discarded = discarded;
exports.left = left;
exports.take = take;
exports.takeOne = takeOne;
exports.resetTotals = resetTotals;

