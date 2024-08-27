import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { ChatMessage, ChatSubscription } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../lib/toast';

Meteor.methods<ServerMethods>({
	unpinMessage(message: IMessage) {
		if (!Meteor.userId()) {
			dispatchToastMessage({ type: 'error', message: t('error-not-authorized') });
			return false;
		}
		if (!settings.get('Message_AllowPinning')) {
			dispatchToastMessage({ type: 'error', message: t('unpinning-not-allowed') });
			return false;
		}
		if (!ChatSubscription.findOne({ rid: message.rid })) {
			dispatchToastMessage({ type: 'error', message: t('error-unpinning-message') });
			return false;
		}
		if (typeof message._id !== 'string') {
			dispatchToastMessage({ type: 'error', message: t('error-unpinning-message') });
			return false;
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
