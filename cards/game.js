var ws;
var myname;
var deck = [];
var zIndex = 0;
var x = [],
    y = [],
    xdiscarded, ydiscarded;
const back = 'backbluepattern1.gif';
var hands = [];
var cnt = [];
var cWidth, cHeight;
const anim = 100;
var tookOne = false;

var jqueue = [];
var busy = false;
var wCard;

function execute() {
    if (jqueue.length > 0) {
        busy = true;
        let a = jqueue.shift();
        if (a.action == 'animate') {
            $(a.selector).animate(a.p1, a.p2, execute);
        } else if (a.action == 'attr') {
            $(a.selector).attr(a.p1, a.p2);
            execute();
        } else if (a.action == 'css') {
            $(a.selector).css(a.p1, a.p2);
            execute();
        }
    } else {
        busy = false;
    }
}

function addToQueue(action, selector, p1, p2) {
    jqueue.push({
        action,
        selector,
        p1,
        p2
    });
    if (!busy) execute();
}

function cardClick(id) {
    sel = "#" + id;
    if (($(sel).attr('data-dropped'))) return;
    let j;
    let iCard = id.substring(1);

    for (j = 0; j < cnt[0]; j++) {
        if (hands[0][j].iCard == iCard) break;
    }
    if (j < cnt[0]) {
        ws.send('{"command":"discard", "i":' + iCard + '}');
        $(btntakeOne).disable();
    }
}

$(document).ready(function() {
    $(btndeal).disable();
    $(btnjoin).enable();
    $(btnleave).disable();
    $(btnreset).disable();
    $(discard).droppable({
        drop: function(event, ui) {
            let d = ui.draggable; // draggable attr id
            d.draggable('option', 'revert', false);
            d.draggable('disable');
            sel = "#" + d.attr('id')
            $(sel).attr('data-dropped', true);
            ws.send('{"command":"discard", "i":' + d.attr('id').substring(1) + '}');
            $(btntakeOne).disable();
        }
    });
    reset();
});

function findPlayer(playerName) {
    return playerName == myname ? 0 : 1;
}

function reset() {
    $("img").remove();
    let r = $(name0).offset();
    zIndex = 0;
    x[0] = r.left;
    y[0] = r.top + $(name0).height() + 15;
    r = $(name1).offset();
    x[1] = r.left;
    y[1] = r.top + 10 + $(name1).height();;
    r = $(discard).offset();
    xdiscarded = r.left + 5;
    ydiscarded = r.top + 5;
    $(btntake).disable();
    $(btntakeOne).disable();
    hands[0] = [];
    hands[1] = [];
    cnt[0] = 0;
    cnt[1] = 0;
    $('#win0, #win1').html('');
    $('#result0, #result1').html('');
    tookOne = false;
}

function join() {

    myname = $(inputname).val();
    if (myname <= '') {
        $("#dialog-missing").dialog({
            resizable: false,
            modal: true,
            buttons: {
                Ok: function() {
                    $(this).dialog("close");
                }
            }
        });
        return;
    }

    $(btndeal).enable();
    $(btnjoin).disable();
    $(btnreset).enable();

    var l = window.location.toString();
    if (l.indexOf("https") >= 0)
        ws = new WebSocket(l.replace("https://", "wss://") + "crdsocket/" + myname);
    else
        ws = new WebSocket(l.replace("http://", "ws://") + "crdsocket/" + myname);

    ws.onopen = function(e) {
        ws.send('{"command":"join"}');
        $(btnjoin).disable();
        $(btnleave).enable();

    }

    ws.onmessage = function(msg) {
        let iCard;
        let player;

        let cmd = JSON.parse(msg.data);

        if (cmd.command == 'reset') {
            reset();

        } else if (cmd.command == 'init') {
            iCard = cmd.iCard;
            deck[iCard] = cmd.card;
            var c = "<img id='{0}' src='{1}' style='left:{2}; top:{3}' onclick='cardClick(this.id)'></img>".format(
                'c' + iCard,
                back,
                '10px',
                ($(btnreset).offset().top + $(btnreset).outerHeight() + 10 + 3 * iCard) + 'px'
            );
            $(maindiv).append(c);
            $(btntake).enable();
            $(btntakeOne).enable();
            $(btndeal).disable();

        } else if (cmd.command == 'card') {
            iCard = cmd.iCard;
            player = findPlayer(cmd.name);

            let j = cnt[player]++;
            wCard = Math.min($('#c0').width() + 5, $(discard).width() * 1.25 / 6);
            let xc = x[player] + j * wCard;
            hands[player][j] = {
                iCard: iCard,
                x: x
            };
            if (player == 0) {
                $('#c' + iCard).draggable({
                    revert: true
                });
                addToQueue('animate', '#c' + iCard, {
                    top: y[player] + 'px',
                    left: xc + 'px'
                }, anim);
                addToQueue('attr', '#c' + iCard, 'src', deck[iCard].color + deck[iCard].value + '.gif');
            } else {
                addToQueue('animate', '#c' + iCard, {
                    top: y[player] + 'px',
                    left: xc + 'px'
                }, anim);
            }
            addToQueue('css', '#c' + iCard, "z-index", j);
            //$('#c' + iCard).css("z-index", j);

        } else if (cmd.command == 'joined') {
            player = findPlayer(cmd.name);
            $("#name" + player).html(cmd.name);

        } else if (cmd.command == 'dealer') {
            // if (cmd.name == myname) {
            //     $(btndeal).enable();
            // } else {
            //     $(btndeal).disable();
            // }

        } else if (cmd.command == 'discarded') {
            player = findPlayer(cmd.name);
            iCard = cmd.iCard;
            addToQueue('animate', '#c' + iCard, {
                top: ydiscarded + 'px',
                left: xdiscarded + 'px'
            }, anim);
            addToQueue('attr', '#c' + iCard, 'src', back);
            addToQueue('css', '#c' + iCard, "z-index", zIndex++);
            //$('#c' + iCard).css("z-index", zIndex++);
            xdiscarded += 10;
            let j;
            for (j = 0; j < cnt[player]; j++) {
                if (hands[player][j].iCard == iCard) break;
            }
            for (j = j + 1; j < cnt[player]; j++) {
                hands[player][j - 1] = hands[player][j];
                let xc = x[player] + (j - 1) * wCard;
                addToQueue('animate', '#c' + hands[player][j - 1].iCard, {
                    top: y[player] + 'px',
                    left: xc + 'px'
                }, anim);
            }
            cnt[player]--;
            if (tookOne && cnt[player] == 2) {
                $(btntake).enable();
                $("#c" + hands[player][0].iCard).draggable('disable');
                $("#c" + hands[player][1].iCard).draggable('disable');
            }

        } else if (cmd.command == 'rearrange') {

            player = findPlayer(cmd.name);
            let i, j, k, imin, cmin;

            for (i = 0; i < cnt[player]; i++) {

                for (t = 0; t < cnt[player]; t++) {
                    k = hands[player][t].iCard;
                }

                imin = i;
                cmin = hands[player][i].iCard;
                for (j = i + 1; j < cnt[player]; j++) {
                    k = hands[player][j].iCard;
                    if (deck[k].value < deck[cmin].value) {
                        imin = j;
                        cmin = k;
                    }
                }

                if (imin - i > 0) {
                    addToQueue('animate', '#c' + cmin, {
                        top: y[player] + $('#c0').height() + 5
                    }, anim);
                    pom = hands[player][imin].iCard;
                    for (k = imin - 1; k >= i; k--) {
                        addToQueue('animate', '#c' + hands[player][k].iCard, {
                            left: x[player] + (k + 1) * wCard
                        }, anim);
                        addToQueue('css', '#c' + hands[player][k].iCard, "z-index", k + 1);
                        //$('#c' + hands[player][k].iCard).css("z-index", k+1);
                        hands[player][k + 1].iCard = hands[player][k].iCard
                    }
                    addToQueue('animate', '#c' + cmin, {
                        top: y[player],
                        left: x[player] + i * wCard
                    }, anim);
                    addToQueue('css', '#c' + cmin, "z-index", i);
                    //$('#c' + cmin).css("z-index", k+1);
                    hands[player][i].iCard = pom;
                }

            }

        } else if (cmd.command == 'end') {
            for (let k = 0; k < cnt[1]; k++) {
                let iCard = hands[1][k].iCard;
                $('#c' + iCard).attr('src', deck[iCard].color + deck[iCard].value + '.gif');
            }
            $(btndeal).enable();

        } else if (cmd.command == 'result') {
            console.log(cmd);
            player = findPlayer(cmd.name);
            $('#result' + player).html(cmd.result.score);
            $('#total' + player).html(cmd.result.total);
            $('#win' + player).html(cmd.result.winning == 1 ? "Win" : "");
        }
    }
}

function deal() {
    $("img").remove();
    ws.send('{"command":"deal"}');
    $(btndeal).disable();
    //$.get('deal');
}

function leave() {
    ws.close();
    $(btnjoin).enable();
    $(btnleave).disable();
}

function takeOne() {
    $(btntakeOne).disable();
    $(btntake).disable();
    tookOne = true;
    ws.send('{"command":"takeOne"}');
}

function take() {
    $(btntake).disable();
    $(btntakeOne).disable();
    ws.send('{"command":"take"}');
}

function resetTotals() {
    $("#dialog-confirm").dialog({
        resizable: false,
        modal: true,
        buttons: {
            "Confirm": function() {
                $(total0).html("0");
                $(total1).html("0");
                ws.send('{"command":"resetTotals"}')
                $(this).dialog("close");
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        }
    });


}

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

jQuery.fn.extend({
    disable: function() {
        return this.each(function() {
            $(this).attr('disabled', true);
        });
    },
    enable: function() {
        return this.each(function() {
            $(this).attr('disabled', false);
        });
    }
});