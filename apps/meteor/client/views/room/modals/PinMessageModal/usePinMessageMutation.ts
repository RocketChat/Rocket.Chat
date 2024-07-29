import type { IMessage } from '@rocket.chat/core-typings';
import { useUserId, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { Meteor } from 'meteor/meteor';

import { ChatMessage, ChatSubscription } from '../../../../../app/models/client';

export const usePinMessageMutation = () => {
	const userId = useUserId();
	const allowPinning = useSetting('Message_AllowPinning');
	const pinMessageEndpoint = useEndpoint('POST', '/v1/chat.pinMessage');

	return useMutation(
		async ({ message }: { message: IMessage }) => {
			if (!userId) {
				throw new Meteor.Error('error-not-authorized', 'Not authorized', {
					method: 'pinMessage',
				});
			}
			if (!allowPinning) {
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

			await pinMessageEndpoint({ messageId: message._id });
		},
		{
			onSettled: (_data, _error, { message }) => {
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
			},
		},
	);
};
