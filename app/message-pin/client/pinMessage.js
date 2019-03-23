import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';
import { ChatMessage, Subscriptions } from '../../models';
import toastr from 'toastr';
import { TAPi18n } from 'meteor/tap:i18n';

Meteor.methods({
	pinMessage(message) {
		if (!Meteor.userId()) {
			toastr.error(TAPi18n.__('error-pinning-message'));
			return false;
		}
		else if (!settings.get('Message_AllowPinning')) {
			toastr.error(TAPi18n.__('error-pinning-message'));
			return false;
		}
		else if (Subscriptions.findOne({ rid: message.rid }) == null) {
			toastr.error(TAPi18n.__('error-pinning-message'));
			return false;
		}
		else{
			toastr.success(TAPi18n.__('Message_has_been_pinned'));
			return ChatMessage.update({
				_id: message._id,
			}, {
				$set: {
					pinned: true,
				},
			});
		}
	},
	unpinMessage(message) {
		if (!Meteor.userId()) {
			toastr.error(TAPi18n.__('error-unpinning-message'));
			return false;
		}
		else if (!settings.get('Message_AllowPinning')) {
			toastr.error(TAPi18n.__('error-unpinning-message'));
			return false;
		}
		else if (Subscriptions.findOne({ rid: message.rid }) == null) {
			toastr.error(TAPi18n.__('error-unpinning-message'));
			return false;
		}
		else{
			toastr.success(TAPi18n.__('Message_has_been_unpinned'));
			return ChatMessage.update({
				_id: message._id,
			}, {
				$set: {
					pinned: false,
				},
			});
		}
	},
});
