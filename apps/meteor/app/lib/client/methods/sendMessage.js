import { Meteor } from 'meteor/meteor';
import { TimeSync } from 'meteor/mizzao:timesync';
import s from 'underscore.string';

import { ChatMessage, Rooms } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../../lib/callbacks';
import { t } from '../../../utils/client';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';

Meteor.methods({
	sendMessage(message) {
		if (!Meteor.userId() || s.trim(message.msg) === '') {
			return false;
		}
		const messageAlreadyExists = message._id && ChatMessage.findOne({ _id: message._id });
		if (messageAlreadyExists) {
			return dispatchToastMessage({ type: 'error', message: t('Message_Already_Sent') });
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

		// If the room is bridged, send the message to matrix only
		const { bridged } = Rooms.findOne({ _id: message.rid }, { fields: { bridged: 1 } });
		if (bridged) {
			return;
		}

		message = callbacks.run('beforeSaveMessage', message);
		onClientMessageReceived(message).then(function (message) {
			ChatMessage.insert(message);
			return callbacks.run('afterSaveMessage', message);
		});
	},
});
