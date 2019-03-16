const express = require('express');
// you will probably need to require more dependencies here.
const app = express();

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
  // do any work you need to do, then
  response.render('room.html', {roomName: request.params.roomName});
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

app.get('/:roomName/sentiment', function(request, response){
    ChatRoom.findOne({id: request.params.roomName}, function(err, chatRoom) {
        if (err) return console.error(err);
        response.json(chatRoom.sentiment);
    });
    
});

app.get('/:roomName/messages', function(request, response){
    ChatRoom.findOne({id: request.params.roomName}, function(err, chatRoom) {
        if (err) return console.error(err);
        response.json(chatRoom.messages);
    });
    
});

app.post('/:roomName/messages', function(request, response){
    const roomName = request.params.roomName;   // 'ABC123'
    const nickname = request.body.nickname; // 'Herbert'
    const message = request.body.message; 
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
            response.end();
        });
    });

});

app.listen(8080);