import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 58,
	up() {
		Settings.update({ _id: 'Push_gateway', value: 'https://rocket.chat' }, {
			$set: {
				value: 'https://gateway.rocket.chat',
				packageValue: 'https://gateway.rocket.chat',
			},
		});
	},
});
