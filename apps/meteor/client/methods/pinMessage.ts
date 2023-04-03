import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { ChatMessage, ChatSubscription } from '../../app/models/client';
import { settings } from '../../app/settings/client';

Meteor.methods<ServerMethods>({
	pinMessage(message: IMessage) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'pinMessage',
			});
		}
		if (!settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('pinning-not-allowed', 'Pinning messages is not allowed', {
				method: 'pinMessage',
			});
		}
		if (!ChatSubscription.findOne({ rid: message.rid })) {
			throw new Meteor.Error('error-pinning-message', 'Pinning messages is not allowed', {
				method: 'pinMessage',
			});
		}
		if (typeof message._id !== 'string') {
			throw new Meteor.Error('error-pinning-message', 'Invalid message', {
				method: 'pinMessage',
			});
		}

		ChatMessage.update(
			{
				_id: message._id,
				rid: message.rid,
			},
			{
				$set: {
					pinned: true,
				},
			},
		);

		const msg = ChatMessage.findOne({ _id: message._id });

		if (!msg) {
			throw new Meteor.Error('error-pinning-message', 'Error pinning message', {
				method: 'pinMessage',
			});
		}

		return msg;
	},
});
