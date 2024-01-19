import type { IMessage, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import { ChatMessage, ChatRoom } from '../../../models/client';
import { settings } from '../../../settings/client';
import { t } from '../../../utils/lib/i18n';

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
		const user = Meteor.user() as IUser | null;
		if (!user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendMessage' });
		}
		message.ts = new Date();
		message.u = {
			_id: uid,
			username: user.username,
			name: user.name || '',
		};
		message.temp = true;
		if (settings.get('Message_Read_Receipt_Enabled')) {
			message.unread = true;
		}

		// If the room is federated, send the message to matrix only
		const room = ChatRoom.findOne({ _id: message.rid }, { fields: { federated: 1, name: 1 } });
		if (room?.federated) {
			return;
		}

		await onClientMessageReceived(message as IMessage).then((message) => {
			ChatMessage.insert(message);
			return callbacks.run('afterSaveMessage', message, room);
		});
	},
});
