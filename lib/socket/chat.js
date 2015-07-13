var crypto = require('crypto');
var util = require('util');

var rooms = {};

// チャットルーム内の全員（自分も含む）にイベント送信
function broadcast(roomId, event, data, fn){
	var userSockets = rooms[roomId];
	Object.keys(userSockets).forEach(function (userSocket){
		userSockets[userSocket].emit(event, data, fn);
	});
};

exports.onConnection = function (socket){

	socket.emit('connected', {});

	socket.on('auth check', function (data){
		if(data.mode === 'create'){
			// 同じ名前のチャットルームがある場合はエラー
			if(rooms[data.roomId] !== undefined){
				socket.emit('room exists', {});
				return;
			}
			rooms[data.roomId] = {};
		}

		if(data.mode === 'enter'){
			// 部屋が存在しない場合はエラー（部屋名とパスワードチェック）
			if(rooms[data.roomId] === undefined){
				socket.emit('room not exists', {});
				return;
			}
			// 同じ名前がある場合エラー
			if(rooms[data.roomId][data.userName] !== undefined){
				socket.emit('userName exists', {});
				return;
			}
		}

		// ユーザソケットとユーザデータを格納
		rooms[socket.id] = data;
		rooms[data.roomId][data.userName] = socket;

		socket.emit('auth check ok', {});

		if(rooms[data.roomId] === undefined){
			return;
		}

		// ルームメンバー更新
		var members = Object.keys(rooms[data.roomId]);
		broadcast(data.roomId, 'update members', members);

		// 入室メッセージ送信
		var message = {
			body: data.userName + 'さんが入室しました'
		};
		broadcast(data.roomId, 'push system message', message);
	});

	// 同じルームに接続しているすべてのクライアントからログを取得する
	socket.on('request log', function (data){
		var userSockets = rooms[data.roomId];
		broadcast(data.roomId, 'collect all clients log', {}, function (log){
			// 各クライアントのmessageLogsが送られてくる
			socket.emit('update log', log);
		});
	});

	// メッセージを送信する
	socket.on('post message', function (message, fn){
		message.date = _formatDate(new Date());
		message.id = (new Date()).getTime();
		broadcast(message.roomId, 'push message', message);
		fn();
	});

	// 切断時
	socket.on('disconnect', function (){
		var data = rooms[socket.id];
		var userSockets = rooms[data.roomId];
		if(userSockets !== undefined){
			delete userSockets[data.userName];
		}
		var members = Object.keys(userSockets);
		if(members.length === 0){
			delete rooms[data.roomId];
		}else{
			// 退室メッセージ送信
			var message = {
				body: data.userName + 'さんが退室しました'
			};
			broadcast(data.roomId, 'push system message', message);
			broadcast(data.roomId, 'update members', members);
		}
	});

	socket.on('hash password', function (password, fn){
		var hashPassword = '';
		var sha512 = crypto.createHash('sha512');
		sha512.update('initial');
		sha512.update(password);
		hashPassword = sha512.digest('hex');
		fn(hashPassword);
	});
};

// Dateオブジェクトから日時を表す文字列を生成する
function _formatDate(date) {
	var mm = date.getMonth();
	var dd = date.getDate();
	var HH = date.getHours();
	var MM = date.getMinutes();
	if (HH < 10) {
		HH = '0' + HH;
	}
	 if (MM < 10) {
		MM = '0' + MM;
	}
	return mm + '/' + dd + ' ' + HH + ':' + MM;
};