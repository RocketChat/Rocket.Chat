import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../settings';
import { ChatMessage, Subscriptions } from '../../models';
import { dispatchToastMessage } from '../../../client/lib/toast';

Meteor.methods({
	pinMessage(message) {
		if (!Meteor.userId()) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-not-authorized') });
			return false;
		}
		if (!settings.get('Message_AllowPinning')) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('pinning-not-allowed') });
			return false;
		}
		if (Subscriptions.findOne({ rid: message.rid }) == null) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-pinning-message') });
			return false;
		}
		if (typeof message._id !== 'string') {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-pinning-message') });
			return false;
		}
		dispatchToastMessage({ type: 'success', message: TAPi18n.__('Message_has_been_pinned') });
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
	unpinMessage(message) {
		if (!Meteor.userId()) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-not-authorized') });
			return false;
		}
		if (!settings.get('Message_AllowPinning')) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('unpinning-not-allowed') });
			return false;
		}
		if (Subscriptions.findOne({ rid: message.rid }) == null) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-unpinning-message') });
			return false;
		}
		if (typeof message._id !== 'string') {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-unpinning-message') });
			return false;
		}
		dispatchToastMessage({ type: 'success', message: TAPi18n.__('Message_has_been_unpinned') });
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
