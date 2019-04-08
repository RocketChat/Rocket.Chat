import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 30,
	up() {
		const WebRTC_STUN_Server = (Settings.findOne('WebRTC_STUN_Server') || {}).value;
		const WebRTC_TURN_Server = (Settings.findOne('WebRTC_TURN_Server') || {}).value;
		const WebRTC_TURN_Username = (Settings.findOne('WebRTC_TURN_Username') || {}).value;
		const WebRTC_TURN_Password = (Settings.findOne('WebRTC_TURN_Password') || {}).value;

		Settings.remove({ _id: 'WebRTC_STUN_Server' });
		Settings.remove({ _id: 'WebRTC_TURN_Server' });
		Settings.remove({ _id: 'WebRTC_TURN_Username' });
		Settings.remove({ _id: 'WebRTC_TURN_Password' });

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
			return Settings.upsert({ _id: 'WebRTC_Servers' }, {
				$set: {
					value: servers,
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});
		}
	},
});
