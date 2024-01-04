import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { ChatMessage, ChatSubscription } from '../../app/models/client';
import { dispatchToastMessage } from '../lib/toast';

Meteor.methods<ServerMethods>({
	markAsDoneMessage(message) {
		const uid = Meteor.userId();

		if (!uid) {
			dispatchToastMessage({ type: 'error', message: 'Error marking as done' });
			return false;
		}

		if (!ChatSubscription.findOne({ rid: message.rid })) {
			dispatchToastMessage({ type: 'error', message: 'Error marking as done' });
			return false;
		}

		if (!ChatMessage.findOneByRoomIdAndMessageId(message.rid, message._id)) {
			dispatchToastMessage({ type: 'error', message: 'Error marking as done' });
			return false;
		}

		if (message.markedAsDone) {
			ChatMessage.update(
				{ _id: message._id },
				{
					$addToSet: {
						markedAsDone: { _id: uid },
					},
				},
			);

			dispatchToastMessage({ type: 'success', message: 'Message has been marked as done!' });

			return true;
		}

		ChatMessage.update(
			{ _id: message._id },
			{
				$pull: {
					markedAsDone: { _id: uid },
				},
			},
		);

		dispatchToastMessage({ type: 'success', message: 'Message has been marked as NOT done' });
		return true;
	},
});
