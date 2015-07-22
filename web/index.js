var querystring = require('querystring');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var ECT = require('ect');
var renderer = ECT({ root : __dirname + '/../views' , ext : '.ect'});

// TOPページ表示
exports.index = function(res){
	var data = { title : 'chat' };
	var html = renderer.render('index', data);
	res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
	res.end(html);
};

// チャットルーム表示
exports.room = function(req, res){
	if(req.method == 'POST'){
		var data = '';
		req.on('data', function(chunk){
			data += chunk;
		});
		req.on('end', sendResponse);
		var sendResponse = function (){
			var query = querystring.parse(data);
			var roomName = query.roomName || '';
			var yourName = query.yourName || '';
			var password = query.password || '';
			var mode = query.mode;

			if(mode === undefined){
				res.writeHead(500);
				return res.end('Server Error');
			}

			var hashPassword = '';
			var sha512 = crypto.createHash('sha512');
			sha512.update('initial');
			sha512.update(password);
			hashPassword = sha512.digest('hex');

			var params = {
				title : 'chat room [' + roomName + ']',
				room : {
					name : roomName,
					password : hashPassword
				},
				userName : yourName,
				mode : mode
			};
			var html = renderer.render('room', params);
			res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
			res.end(html);
		};

	}else{
		res.writeHead(500);
		return res.end('Server Error');
	}
};

// 静的ファイル
exports.static = function(req, res){
	var mimeTypes = {
		'.js': 'text/javascript',
		'.css': 'text/css',
		'.png': 'image/png'
	};

	var filepath = './public' + path.dirname(req.url) + '/' + path.basename(req.url);

	fs.readFile(filepath, function(err, data){
		if(err){
			res.writeHead(500);
			return res.end('Error loading file');
		}
		res.writeHead(200, {
			'Content-Type': mimeTypes[path.extname(req.url)]
		});
		res.end(data);
	});
};
