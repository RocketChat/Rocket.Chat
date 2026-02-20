import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { Meteor } from 'meteor/meteor';

import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { settings } from '../../../../client/lib/settings';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { getUser, getUserId } from '../../../../client/lib/user';
import { Messages, Rooms } from '../../../../client/stores';
import { trim } from '../../../../lib/utils/stringUtils';
import { t } from '../../../utils/lib/i18n';

Meteor.methods<ServerMethods>({
	async sendMessage(message) {
		const uid = getUserId();
		if (!uid || trim(message.msg) === '') {
			return false;
		}
		const messageAlreadyExists = message._id && Messages.state.get(message._id);
		if (messageAlreadyExists) {
			return dispatchToastMessage({ type: 'error', message: t('Message_Already_Sent') });
		}
		const user = getUser();
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
		if (settings.peek('Message_Read_Receipt_Enabled')) {
			message.unread = true;
		}

		// If the room is federated, send the message to matrix only
		const room = Rooms.state.get(message.rid);
		if (room?.federated) {
			return;
		}

		await onClientMessageReceived(message as IMessage).then((message) => {
			Messages.state.store(message);
			void clientCallbacks.run('afterSaveMessage', message, { room, user });

			// Now that the message is stored, we can go ahead and mark as sent
			Messages.state.update(
				(record) => record._id === message._id && record.temp === true,
				({ temp: _, ...record }) => record,
			);
		});
	},
});
