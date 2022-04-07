import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../settings';
import { ChatMessage, Subscriptions } from '../../models';
import { dispatchToastMessage } from '../../../client/lib/toast';

Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-starring-message') });
			return false;
		}
		if (Subscriptions.findOne({ rid: message.rid }) == null) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-starring-message') });
			return false;
		}
		if (!ChatMessage.findOneByRoomIdAndMessageId(message.rid, message._id)) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-starring-message') });
			return false;
		}
		if (!settings.get('Message_AllowStarring')) {
			dispatchToastMessage({ type: 'error', message: TAPi18n.__('error-starring-message') });
			return false;
		}
		if (message.starred) {
			dispatchToastMessage({ type: 'success', message: TAPi18n.__('Message_has_been_starred') });
		} else {
			dispatchToastMessage({ type: 'success', message: TAPi18n.__('Message_has_been_unstarred') });
		}
		return ChatMessage.update(
			{
				_id: message._id,
			},
			{
				$addToSet: {
					starred: !!message.starred,
				},
			},
		);
	},
});
