var http = require('http');
var path = require('path');
var web　 = require('./web')
var chat = require('./lib/socket/chat.js');

var server = http.createServer();
var io = require('socket.io').listen(server);

var PORT = 8080;

server.listen(PORT, function(){
	console.log('chat server listening on port ' + PORT);
});

// ルーティング
server.on('request', function(req, res){
	// console.log('url:'+req.url);
	if(req.url == '/'){
		web.index(res);
	}else if(req.url == '/room/'){
		web.room(req, res);
	}else if(req.url == '/socket.io/socket.io.js'){
		web.room(req, res);
	}else if(path.extname(req.url) == '.js'){
		web.static(req, res);
	}else if(path.extname(req.url) == '.css'){
		web.static(req, res);
	}else if(path.extname(req.url) == '.png'){
		web.static(req, res);
	}
});

// socket.ioのコネクション設定
io.sockets.on('connection', chat.onConnection);
