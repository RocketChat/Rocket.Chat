import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { ChatMessage, ChatSubscription } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/client';
import { dispatchToastMessage } from '../lib/toast';

Meteor.methods<ServerMethods>({
	unpinMessage(message: IMessage) {
		if (!Meteor.userId()) {
			dispatchToastMessage({ type: 'error', message: t('error-not-authorized') });
			return 0;
		}
		if (!settings.get('Message_AllowPinning')) {
			dispatchToastMessage({ type: 'error', message: t('unpinning-not-allowed') });
			return 0;
		}
		if (!ChatSubscription.findOne({ rid: message.rid })) {
			dispatchToastMessage({ type: 'error', message: t('error-unpinning-message') });
			return 0;
		}
		if (typeof message._id !== 'string') {
			dispatchToastMessage({ type: 'error', message: t('error-unpinning-message') });
			return 0;
		}
		dispatchToastMessage({ type: 'success', message: t('Message_has_been_unpinned') });
		ChatMessage.update(
			{
				_id: message._id,
				rid: message.rid,
			},
			{
				$set: {
					pinned: false,
				},
			},
		);

		return true;
	},
});
