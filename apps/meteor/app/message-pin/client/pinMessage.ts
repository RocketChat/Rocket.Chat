import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../settings/client';
import { ChatMessage, ChatSubscription } from '../../models/client';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { t } from '../../utils/client';

Meteor.methods({
	pinMessage(message: IMessage) {
		if (!Meteor.userId()) {
			dispatchToastMessage({ type: 'error', message: t('error-not-authorized') });
			return false;
		}
		if (!settings.get('Message_AllowPinning')) {
			dispatchToastMessage({ type: 'error', message: t('pinning-not-allowed') });
			return false;
		}
		if (!ChatSubscription.findOne({ rid: message.rid })) {
			dispatchToastMessage({ type: 'error', message: t('error-pinning-message') });
			return false;
		}
		if (typeof message._id !== 'string') {
			dispatchToastMessage({ type: 'error', message: t('error-pinning-message') });
			return false;
		}
		dispatchToastMessage({ type: 'success', message: t('Message_has_been_pinned') });
		return ChatMessage.update(
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
	},
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
		return ChatMessage.update(
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
	},
});
