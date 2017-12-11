RocketChat.Migrations.add({
	version: 30,
	up() {
		const WebRTC_STUN_Server = (RocketChat.models.Settings.findOne('WebRTC_STUN_Server') || {}).value;
		const WebRTC_TURN_Server = (RocketChat.models.Settings.findOne('WebRTC_TURN_Server') || {}).value;
		const WebRTC_TURN_Username = (RocketChat.models.Settings.findOne('WebRTC_TURN_Username') || {}).value;
		const WebRTC_TURN_Password = (RocketChat.models.Settings.findOne('WebRTC_TURN_Password') || {}).value;

		RocketChat.models.Settings.remove({_id: 'WebRTC_STUN_Server'});
		RocketChat.models.Settings.remove({_id: 'WebRTC_TURN_Server'});
		RocketChat.models.Settings.remove({_id: 'WebRTC_TURN_Username'});
		RocketChat.models.Settings.remove({_id: 'WebRTC_TURN_Password'});

		if (WebRTC_STUN_Server === 'stun:stun.l.google.com:19302' && WebRTC_TURN_Server === 'turn:numb.viagenie.ca:3478' && WebRTC_TURN_Username === 'team@rocket.chat' && WebRTC_TURN_Password === 'demo') {
			return;
		}

		let servers = '';
		if (WebRTC_STUN_Server) {
			servers += WebRTC_STUN_Server;
		}

		if (WebRTC_TURN_Server) {
			servers += ', ';
			if (WebRTC_TURN_Username != null) {
				servers += `${ encodeURIComponent(WebRTC_TURN_Username) }:${ encodeURIComponent(WebRTC_TURN_Password) }@`;
			}
			servers += WebRTC_TURN_Server;
		}

		if (servers !== '') {
			return RocketChat.models.Settings.upsert({_id: 'WebRTC_Servers'}, {
				$set: {
					value: servers
				},
				$setOnInsert: {
					createdAt: new Date
				}
			});
		}
	}
});
