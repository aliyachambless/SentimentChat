const http = require('http'); // this is new
const express = require('express');
const app = express();
const server = http.createServer(app); // this is new

// add socket.io
const io = require('socket.io').listen(server);

var Sentiment = require('sentiment');
var sentiment = new Sentiment();

const path = require('path');
app.use(express.static('public')); 

var moment = require('moment');

const engines = require('consolidate');
app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname + '/templates'); // tell Express where to find templates, in this case the '/templates' directory
app.set('view engine', 'html'); // register .html extension as template engine so we can render .html pages 

//body parser
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const mongoose = require('mongoose');
const db = mongoose.connection;

db.on('error', console.error); // log any errors that occur

// bind a function to perform when the database has been opened
db.once('open', function() {
  // perform any queries here, more on this later
  console.log("Connected to DB!");
});

// process is a global object referring to the system process running this
// code, when you press CTRL-C to stop Node, this closes the connection
process.on('SIGINT', function() {
   mongoose.connection.close(function () {
       console.log('DB connection closed by Node process ending');
       process.exit(0);
   });
});

// you will replace this with your on url and fill in your password in the next step
const url = 'mongodb+srv://achamble:Luvrm!2345@cs1320chatroom-menfp.mongodb.net/test?retryWrites=true';
mongoose.connect(url, {useNewUrlParser: true});

// we are defining a Schema by specifying data types
const MessageSchema = new mongoose.Schema({
    room: String,
    nickname: String,
    body: String,
    time: String,
    sentiment: Number
});

// Compile a 'Movie' model using the movieSchema as the structure.
// Mongoose also creates a MongoDB collection called 'Movies' for these documents.
const Message = mongoose.model('Message', MessageSchema);

const ChatRoomSchema = new mongoose.Schema({
    id: String,
    messages: [MessageSchema],
    sentiment: Number
});

const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);

app.get('/', function(request, response){
    ChatRoom.find(function(err, chats) {
        if (err) return console.error(err);
        response.render('login.html', {chats: chats.map(each => each.id)});
    });
    
});

app.get('/:roomName', function(request, response){
    ChatRoom.findOne({id: request.params.roomName}, function(err, chatRoom) {
        if(chatRoom != null){
            response.render('room.html', {roomName: request.params.roomName});
        } else {
            response.status(404).type('html');
            response.send('<h1 style="text-align: center; padding:50px;">This chat room does not exist my dude. Go away.</h1>');
        }
    });
});

app.get('/:roomName/create', function(request, response){
    const chatRoom = new ChatRoom({
        id: request.params.roomName,
        messages: [],
        sentiment: 0
    });
    
    chatRoom.save(function(err, data) {  // data is what was just saved
        if (err) return console.error(err);
    });
    
});

app.get('*', function(request, response){
    response.status(404).type('html');
    response.send('<h1>404 Error!</h1><p>This page does not exist.</p>');
});

io.sockets.on('connection', function(socket){
    var roomID;
    // clients emit this when they join new rooms
    socket.on('join', function(roomName, nickname, callback){
        socket.join(roomName);
        socket.nickname = nickname; 
        roomID = roomName;

        ChatRoom.findOne({id: roomName}, function(err, chatRoom) { 
            callback(chatRoom.messages, chatRoom.sentiment);
        });
        
        membershipChanged(roomName);
    });

    // the client emits this when they want to send a message
    socket.on('message', function(message){

        const roomName = roomID;
        const nickname = socket.nickname; // 'Herbert'
        const time = moment().calendar();

        const messageSentiment = sentiment.analyze(message).comparative;

        const newMessage = new Message({
            room: roomName,
            nickname: nickname,
            body: message,
            time: time,
            sentiment: messageSentiment
        });

        ChatRoom.findOne({id: roomName}, function(err, chatRoom) {
            if (err) return console.error(err);
            chatRoom.messages.push(newMessage);
            chatRoom.sentiment += messageSentiment;
            if(chatRoom.sentiment < -5){
                chatRoom.sentiment = -5;
            } else if(chatRoom.sentiment > 5) {
                chatRoom.sentiment = 5;   
            }
            chatRoom.save(function(err, data) {  // data is what was just saved
                if (err) return console.error(err);
            });
            io.sockets.in(roomName).emit('refreshSentiment', chatRoom.sentiment);
        });

        // then send the message to users!
        io.sockets.in(roomName).emit('message', nickname, message, time, messageSentiment);
    });

    // the client disconnected/closed their browser window
    socket.on('disconnect', function(){
        membershipChanged(roomID);
    });

    // an error occured with sockets
    socket.on('error', function(){
        console.error("There was an error, sorry!");
    });

});

function membershipChanged(roomName) {
    // send them out
    var room = io.sockets.adapter.rooms[roomName];
    if(room != undefined){
        var clients = io.sockets.adapter.rooms[roomName].sockets;   

        //to get the number of clients
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

        let members = [];

        for (var id in clients ) {
            members.push(io.sockets.connected[id].nickname);
        }

        io.sockets.in(roomName).emit('membershipChanged', members);
    }
}

// changed from *app*.listen(8080);
server.listen(8080);

