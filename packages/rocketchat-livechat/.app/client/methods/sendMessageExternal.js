import { Meteor } from 'meteor/meteor';
import { TimeSync } from 'meteor/mizzao:timesync';
import s from 'underscore.string';

import visitor from '../../imports/client/visitor';

Meteor.methods({
	sendMessageLivechat(message) {
		if (s.trim(message.msg) !== '') {
			if (isNaN(TimeSync.serverOffset())) {
				message.ts = new Date();
			} else {
				message.ts = new Date(Date.now() + TimeSync.serverOffset());
			}

			const user = Meteor.user();

			message.u = {
				_id: visitor.getId(),
				username: (user && user.username) || 'visitor',
			};

			message.temp = true;

			// message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.insert(message);
		}
	},
});
