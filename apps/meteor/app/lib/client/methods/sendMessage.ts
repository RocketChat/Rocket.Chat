import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IMessage, IUser } from '@rocket.chat/core-typings';

import { ChatMessage, Rooms } from '../../../models/client';
import { settings } from '../../../settings/client';
import { callbacks } from '../../../../lib/callbacks';
import { t } from '../../../utils/client';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { trim } from '../../../../lib/utils/stringUtils';

Meteor.methods<ServerMethods>({
	async sendMessage(message) {
		const uid = Meteor.userId();
		if (!uid || trim(message.msg) === '') {
			return false;
		}
		const messageAlreadyExists = message._id && ChatMessage.findOne({ _id: message._id });
		if (messageAlreadyExists) {
			return dispatchToastMessage({ type: 'error', message: t('Message_Already_Sent') });
		}
		const user = (await Meteor.userAsync()) as IUser | null;
		if (!user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendMessage' });
		}
		message.ts = new Date();
		message.u = {
			_id: uid,
			username: user.username,
			...(settings.get('UI_Use_Real_Name') && user.name && { name: user.name }),
		};
		message.temp = true;
		if (settings.get('Message_Read_Receipt_Enabled')) {
			message.unread = true;
		}

		// If the room is federated, send the message to matrix only
		const federated = Rooms.findOne({ _id: message.rid }, { fields: { federated: 1 } })?.federated;
		if (federated) {
			return;
		}

		message = callbacks.run('beforeSaveMessage', message);
		await onClientMessageReceived(message as IMessage).then(function (message) {
			ChatMessage.insert(message);
			return callbacks.run('afterSaveMessage', message);
		});
	},
});
