import { Meteor } from 'meteor/meteor';
import { TimeSync } from 'meteor/mizzao:timesync';
import { ChatMessage } from '../../../models';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises';
import s from 'underscore.string';


// Message: thread replies = { user, ts }
Meteor.methods({
	reply({ mid, msg }) {

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'reply' });
		}

		const parentMessage = ChatMessage.findOne(mid);

		if (!parentMessage) {
			throw new Meteor.Error('error-invalid-message', 'Message invalid', { method: 'reply' });
		}

		if (s.trim(msg.msg) === '') {
			throw new Meteor.Error('error-invalid-message', 'Message invalid', { method: 'reply' });
		}

		const user = Meteor.user();
		msg.rid = parentMessage.rid;
		msg.pmid = mid;
		msg.ts = new Date();
		msg.u = {
			_id: Meteor.userId(),
			username: user.username,
		};
		if (settings.get('UI_Use_Real_Name')) {
			msg.u.name = user.name;
		}
		msg.temp = true;

		if (settings.get('Message_Read_Receipt_Enabled')) {
			msg.unread = true;
		}

		msg = callbacks.run('beforeSaveMessage', msg);

		promises.run('onClientMessageReceived', msg).then(function(message) {
			ChatMessage.insert(message);
			return callbacks.run('afterSaveMessage', message);
		});
	},
});
