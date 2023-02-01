import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../settings/client';
import { ChatMessage, ChatSubscription } from '../../models/client';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { t } from '../../utils/client';

Meteor.methods({
	starMessage(message: Omit<IMessage, 'starred'> & { starred: boolean }) {
		const uid = Meteor.userId();

		if (!uid) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (!ChatSubscription.findOne({ rid: message.rid })) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (!ChatMessage.findOneByRoomIdAndMessageId(message.rid, message._id)) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (!settings.get('Message_AllowStarring')) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (message.starred) {
			ChatMessage.update(
				{ _id: message._id },
				{
					$addToSet: {
						starred: { _id: uid },
					},
				},
			);

			dispatchToastMessage({ type: 'success', message: t('Message_has_been_starred') });
		} else {
			ChatMessage.update(
				{ _id: message._id },
				{
					$pull: {
						starred: { _id: uid },
					},
				},
			);

			dispatchToastMessage({ type: 'success', message: t('Message_has_been_unstarred') });
		}
	},
});
