import { Meteor } from 'meteor/meteor';
import { TimeSync } from 'meteor/mizzao:timesync';
import s from 'underscore.string';

import { ChatMessage } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises/client';

Meteor.methods({
	sendMessage(message) {
		if (!Meteor.userId() || s.trim(message.msg) === '') {
			return false;
		}
		const user = Meteor.user();
		message.ts = isNaN(TimeSync.serverOffset()) ? new Date() : new Date(Date.now() + TimeSync.serverOffset());
		message.u = {
			_id: Meteor.userId(),
			username: user.username,
		};
		if (settings.get('UI_Use_Real_Name')) {
			message.u.name = user.name;
		}
		message.temp = true;
		if (settings.get('Message_Read_Receipt_Enabled')) {
			message.unread = true;
		}
		message = callbacks.run('beforeSaveMessage', message);
		promises.run('onClientMessageReceived', message).then(function(message) {
			ChatMessage.insert(message);
			return callbacks.run('afterSaveMessage', message);
		});
	},
});
