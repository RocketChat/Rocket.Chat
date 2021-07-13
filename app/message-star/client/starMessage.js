import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../settings';
import { ChatMessage, Subscriptions } from '../../models';

Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			toastr.error(TAPi18n.__('error-starring-message'));
			return false;
		}
		if (Subscriptions.findOne({ rid: message.rid }) == null) {
			toastr.error(TAPi18n.__('error-starring-message'));
			return false;
		}
		if (!ChatMessage.findOneByRoomIdAndMessageId(message.rid, message._id)) {
			toastr.error(TAPi18n.__('error-starring-message'));
			return false;
		}
		if (!settings.get('Message_AllowStarring')) {
			toastr.error(TAPi18n.__('error-starring-message'));
			return false;
		}
		if (message.starred) {
			toastr.success(TAPi18n.__('Message_has_been_starred'));
		} else {
			toastr.success(TAPi18n.__('Message_has_been_unstarred'));
		}
		return ChatMessage.update({
			_id: message._id,
		}, {
			$set: {
				starred: !!message.starred,
			},
		});
	},
});
