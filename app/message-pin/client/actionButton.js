import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { RoomHistoryManager, MessageAction } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { handleError } from '../../utils';
import { settings } from '../../settings';
import { Subscriptions } from '../../models';
import { hasAtLeastOnePermission } from '../../authorization';
import toastr from 'toastr';

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin_Message',
		context: ['pinned', 'message', 'message-mobile'],
		action() {
			const { msg: message } = messageArgs(this);
			message.pinned = true;
			Meteor.call('pinMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		condition(message) {
			if	(!settings.get('Message_AllowPinning') || message.pinned || !Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}

			return hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 20,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'unpin-message',
		icon: 'pin',
		label: 'Unpin_Message',
		context: ['pinned', 'message', 'message-mobile'],
		action() {
			const { msg: message } = messageArgs(this);
			message.pinned = false;
			Meteor.call('unpinMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		condition(message) {
			if	(!settings.get('Message_AllowPinning') || !message.pinned || !Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}

			return hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 21,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'jump-to-pin-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['pinned'],
		action() {
			const { msg: message } = messageArgs(this);
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		condition(message) {
			if (!Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}
			return true;
		},
		order: 100,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'permalink-pinned',
		icon: 'permalink',
		label: 'Permalink',
		classes: 'clipboard',
		context: ['pinned'],
		async action(event) {
			const { msg: message } = messageArgs(this);
			$(event.currentTarget).attr('data-clipboard-text', await MessageAction.getPermaLink(message._id));
			toastr.success(TAPi18n.__('Copied'));
		},
		condition(message) {
			if (!Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}
			return true;
		},
		order: 101,
		group: 'menu',
	});
});
