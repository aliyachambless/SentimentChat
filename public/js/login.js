$( document ).ready(function() {
    let meta = document.querySelector('meta[name=chats]');
    
    let chats = meta.content.split(",");
    jQuery.each( chats, function( i, val ) {
        $("#chatRooms").append('<div class="chatOption"><img src= "../img/box.png"><a class="roomName" href="' + val + '">Chat: ' + val + '</a></div>');
    });
});
    
function newChat(){
    let id = generateRoomIdentifier();
    $("#chatRooms").prepend('<div class="chatOption"><img src= "../img/box.png"><a class="roomName" href="' + id + '">New: ' + id + '</a></div>');
    let url = "/" + id + "/create"
    $.get(url, function(data, status){
//        console.log(data);
    });
    window.location.href = "/" + id;
}

function generateRoomIdentifier() {
  // make a list of legal characters
  // we're intentionally excluding 0, O, I, and 1 for readability
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let result = '';
  for (let i = 0; i < 6; i++)
    result += chars[Math.floor(Math.random() * chars.length)];

  return result;
}