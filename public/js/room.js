
(function(){
	var socket;
	var messageLogs = {};

	$(document).ready(function(){
		socket = io.connect();
		
		// 接続開始
		socket.on('connected', function (data){
			socket.emit('auth check', minichat);
		});

		// 作成する部屋が既に存在する
		socket.on('room exists', function (data){
			authError('ルーム名/パスワードが不正です');
		});
		// 入室する部屋が存在しない
		socket.on('room not exists', function (data){
			authError('同名のルームがすでに存在します');
		});
		// 入室するユーザ名がすでに存在する
		socket.on('userName exists', function (data){
			authError('その名前はすでに使われています');
		});

		// 認証OK
		socket.on('auth check ok', function (data){
			socket.emit('request log', minichat);
		});

		// チャットメンバー更新
		socket.on('update members', function (members){
			$("#members").empty();
			for(var i = 0; i < members.length; i++){
				$("#members").append(members[i] + ' ');
			}
		});

		// システムメッセージ送信
		socket.on('push system message', function (message){
			var html = '<div class="systemMessage">'
				+ '<p>' + message.body +'</p>'
				+ '</div>';
			$("#systemMessages").append(html);
		});

		// ルームのチャットログを収集する
		socket.on('collect all clients log', function (data, callback){
			callback(messageLogs);
		});

		// チャットログを更新する
		socket.on('update log', function (log){
			Object.keys(log).forEach(function (key){
				messageLogs[key] = log[key];
			});
			updateMessage();
		});

		// チャットメッセージ受信し、更新する
		socket.on('push message', function (message){
			messageLogs[message.id] = message;
			var html = '<div class="message" id="' + message.id + '">'
				+ '<p class="postdate pull-right">' + message.date + '</p>'
				+ '<p class="author">' + message.from + '：</p>'
				+ '<p class="comment">' + message.body + '</p>'
				+ '</div>';
			$('#messages').prepend(html);
		});

		// メッセージ送信ボタン押下
		$('#postMessage').on('click', function (){
			var message = {
				from : minichat.userName,
				body : $('#messageBox').val(),
				roomId : minichat.roomId
			};
			socket.emit('post message', message, function (){
				$('#messageBox').val('');
			});
		});

		// 認証失敗時の再ログイン
		$('#loginRetry').on('submit', function (){
			$('#errorDialog').modal('hide');
			socket.emit('hash password', $('#password').val(), function (hashedPassword){
				minichat.roomName = $('#newRoom').val();
				minichat.userName = $('#newName').val();
				minichat.password = hashedPassword;
				minichat.roomId = minichat.roomName + minichat.password;
				socket.emit('auth check', minichat);
			});
		});
	});

	// チャットメッセージを更新する
	function updateMessage(){
		$('#messages').empty();
		var keys = Object.keys(messageLogs);
		keys.sort();
		keys.forEach(function (key){
			var message = messageLogs[key];
			var html = '<div class="message" id="' + message.id + '">'
				+ '<p class="postdate pull-right">' + message.date + '</p>'
				+ '<p class="author">' + message.from + '：</p>'
				+ '<p class="comment">' + message.body + '</p>'
				+ '</div>';
			$('#messages').prepend(html);
		});
	}

	function authError(message){
		$('#errorMessage').text(message);
		$('#newRoom').val(minichat.roomName);
		$('#newName').val(minichat.userName);
		$('#errorDialog').modal('show');
	}

}).apply(this);

// JavaScriptのstrictモード＊2を有効にした場合、
// 関数内のthisは、グローバルオブジェクトではなく、undefinedになってしまうため