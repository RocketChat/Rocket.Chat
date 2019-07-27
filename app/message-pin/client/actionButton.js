import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import toastr from 'toastr';

import { RoomHistoryManager, MessageAction } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { handleError } from '../../utils';
import { settings } from '../../settings';
import { hasAtLeastOnePermission } from '../../authorization';

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin',
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
		condition({ msg, subscription }) {
			if (!settings.get('Message_AllowPinning') || msg.pinned || !subscription) {
				return false;
			}

			return hasAtLeastOnePermission('pin-message', msg.rid);
		},
		order: 7,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'unpin-message',
		icon: 'pin',
		label: 'Unpin',
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
		condition({ msg, subscription }) {
			if (!subscription || !settings.get('Message_AllowPinning') || !msg.pinned) {
				return false;
			}

			return hasAtLeastOnePermission('pin-message', msg.rid);
		},
		order: 8,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'jump-to-pin-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['pinned', 'message', 'message-mobile'],
		action() {
			const { msg: message } = messageArgs(this);
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 100,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'permalink-pinned',
		icon: 'permalink',
		label: 'Get_link',
		classes: 'clipboard',
		context: ['pinned'],
		async action(event) {
			const { msg: message } = messageArgs(this);
			$(event.currentTarget).attr('data-clipboard-text', await MessageAction.getPermaLink(message._id));
			toastr.success(TAPi18n.__('Copied'));
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 101,
		group: 'menu',
	});
});
