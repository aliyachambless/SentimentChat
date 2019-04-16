const socket = io.connect();

let meta = document.querySelector('meta[name=roomName]');
let roomName = meta.content;

$(document).ready(function(){
    const messageForm = $('#messageForm').submit(sendMessage);
    updateScroll();
    
    // handle incoming messages
    socket.on('message', function(nickname, message, time, sentiment, id){
        // display a newly-arrived message
        var color = (sentiment > 0) ? 'green' : 'red';
        sentiment = sentiment.toFixed(2);
        sentiment = (sentiment == 0) ? '' : sentiment;
        sentiment = (sentiment > 0) ? '+' + sentiment : sentiment;

        $("#messages").append("<li id ='" + id + "'><div class='message'><div class='messageBody'>" + message + "</div><div class='info'><div class='nickname'>-" + nickname + "</div><div class='time'> " + time + '</div></div></div><div class="sentiment"><p class="' + color + '">' + sentiment + '</p></div></li>');
        updateScroll();
    });
    
    // handle room membership changes
    // you may want to consider having separate handlers for members joining, leaving, and changing their nickname
    socket.on('membershipChanged', function(members){
        $("#members").empty();
        jQuery.each(members, function( i, val ) {
            $("#members").append("<li id ='" + val + "'>" + val + '</li>');
        });
    });
    
    socket.on('refreshSentiment', function(sentiment){
        refreshSentiment(sentiment);
    });
    
    let nickname = prompt("What's your nickname?");
    $('#nicknameField').val(nickname);
    
    // join the room
    socket.emit('join', roomName, nickname, function(messages, sentiment){
        refreshSentiment(sentiment);
        jQuery.each(messages, function( i, val ) {
            if($("#messages").find( "#" + val._id ).length == 0){
                var color = (val.sentiment > 0) ? 'green' : 'red';
                val.sentiment = val.sentiment.toFixed(2);
                val.sentiment = (val.sentiment == 0) ? '' : val.sentiment;
                val.sentiment = (val.sentiment > 0) ? '+' + val.sentiment : val.sentiment;
                
                $("#messages").append("<li id ='" + val._id + "'><div class='message'><div class='messageBody'>" + val.body + "</div><div class='info'><div class='nickname'>-" + val.nickname + "</div><div class='time'> " + val.time + '</div></div></div><div class="sentiment"><p class="' + color + '">' + val.sentiment + '</p></div></li>');
                updateScroll();
            }
        });
    });
    
    $("#messageField").keyup(function() {
        nickname = $('#nicknameField').val();
        socket.emit('join', roomName, nickname + " is typing...", function(messages, sentiment){});
        setTimeout(function(){ 
            socket.emit('join', roomName, nickname, function(messages, sentiment){});
        }, 2500);
    });
});

function refreshSentiment(data){
    switch(true) {
        case (data < -4):
            newSrc = '../img/lil-bois/bad5.png';
            break;
        case (data < -3):
            newSrc = '../img/lil-bois/bad4.png';
            break;
        case (data < -2):
            newSrc = '../img/lil-bois/bad3.png';
            break;
        case (data < -1):
            newSrc = '../img/lil-bois/bad2.png';
            break;
        case (data < 0):
            newSrc = '../img/lil-bois/bad1.png';
            break;
        case (data < 1):
            newSrc = '../img/lil-bois/good1.png';
            break;
        case (data < 2):
            newSrc = '../img/lil-bois/good2.png';
            break;
        case (data < 3):
            newSrc = '../img/lil-bois/good3.png';
            break;
        case (data < 4):
            newSrc = '../img/lil-bois/good4.png';
            break;
        case (data >= 4):
            newSrc = '../img/lil-bois/good5.png';
            break;
        default:
            newSrc = '../img/lil-bois/good1.png';
    }
    $('#boi-img').attr('src', newSrc);
    $('#roomSentiment').html(data.toFixed(2));
}

function sendMessage(event) {
    // prevent the page from redirecting
    event.preventDefault();

    // get the parameters
    const nickname = $('#nicknameField').val(); 
    const message = $('#messageField').val();
    
    socket.emit('join', roomName, nickname, function(messages, sentiment){});
    
    if(message.length > 0){

        // send it to the server
        socket.emit('message', message);
        $('#messageField').val("");
    }
}

function newNickname(){
    let nickname = prompt("What's your nickname?");
    $('#nicknameField').val(nickname);
    socket.emit('join', roomName, nickname, function(messages, sentiment){});
}

function updateScroll(){
    var element = document.getElementById("message-holder");
    element.scrollTop = element.scrollHeight;
}

$(window).blur(function(e) {
    let nickname = $('#nicknameField').val();
    nickname += " (away)";
    socket.emit('join', roomName, nickname, function(messages, sentiment){});
});

$(window).focus(function(e) {
    const nickname = $('#nicknameField').val(); 
    socket.emit('join', roomName, nickname, function(messages, sentiment){});
});
