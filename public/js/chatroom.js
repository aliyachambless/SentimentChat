let nickname = prompt("What's your nickname?");
$('#nicknameField').val(nickname);

let meta = document.querySelector('meta[name=roomName]');
let roomName = meta.content;

$(document).ready(function(){
    const messageForm = $('#messageForm').submit(sendMessage);
    refreshMessages();
    setInterval(refreshMessages, 2000);
    updateScroll();
});

function refreshMessages(){
    let url = "/" + roomName + "/messages"
    $.get(url, function(data, status){
        jQuery.each(data, function( i, val ) {
            if($("#messages").find( "#" + val._id ).length == 0){
                var color = (val.sentiment > 0) ? 'green' : 'red';
                val.sentiment = (val.sentiment == 0) ? '' : val.sentiment;
                val.sentiment = (val.sentiment > 0) ? '+' + val.sentiment : val.sentiment;
                
                $("#messages").append("<li id ='" + val._id + "'><div class='message'><div class='messageBody'>" + val.body + "</div><div class='info'><div class='nickname'>-" + val.nickname + "</div><div class='time'> " + val.time + '</div></div></div><div class="sentiment"><p class="' + color + '">' + val.sentiment + '</p></div></li>');
                updateScroll();
                refreshSentiment();
            }
        });
    });
}

function refreshSentiment(){
    let url = "/" + roomName + "/sentiment"
    $.get(url, function(data, status){
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
    });
}

function sendMessage(event) {
    // prevent the page from redirecting
    event.preventDefault();

    // get the parameters
    const nickname = $('#nicknameField').val(); 
    const message = $('#messageField').val();
    
    if(message.length > 0){

        // send it to the server
        $.post('/' + roomName + '/messages', { nickname: nickname, message: message }, function(res){
            refreshMessages();
        });

        $('#messageField').val("");
    }
}

function updateScroll(){
    var element = document.getElementById("message-holder");
    element.scrollTop = element.scrollHeight;
}
