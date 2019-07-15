import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import toastr from 'toastr';

import { handleError } from '../../utils';
import { settings } from '../../settings';
import { RoomHistoryManager, MessageAction } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'star-message',
		icon: 'star',
		label: 'Star',
		context: ['starred', 'message', 'message-mobile', 'threads'],
		action() {
			const { msg: message } = messageArgs(this);
			message.starred = Meteor.userId();
			Meteor.call('starMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		condition({ msg: message, subscription, u }) {
			if (subscription == null && settings.get('Message_AllowStarring')) {
				return false;
			}

			return !message.starred || !message.starred.find((star) => star._id === u._id);
		},
		order: 9,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'unstar-message',
		icon: 'star',
		label: 'Unstar_Message',
		context: ['starred', 'message', 'message-mobile', 'threads'],
		action() {
			const { msg: message } = messageArgs(this);
			message.starred = false;
			Meteor.call('starMessage', message, function(error) {
				if (error) {
					handleError(error);
				}
			});
		},
		condition({ msg: message, subscription, u }) {
			if (subscription == null && settings.get('Message_AllowStarring')) {
				return false;
			}

			return message.starred && message.starred.find((star) => star._id === u._id);
		},
		order: 9,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'jump-to-star-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['starred', 'threads', 'message', 'message-mobile'],
		action() {
			const { msg: message } = messageArgs(this);
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		condition({ msg, subscription, u }) {
			if (subscription == null || !settings.get('Message_AllowStarring')) {
				return false;
			}

			return msg.starred && msg.starred.find((star) => star._id === u._id);
		},
		order: 100,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'permalink-star',
		icon: 'permalink',
		label: 'Get_link',
		classes: 'clipboard',
		context: ['starred', 'threads'],
		async action(event) {
			const { msg: message } = messageArgs(this);
			$(event.currentTarget).attr('data-clipboard-text', await MessageAction.getPermaLink(message._id));
			toastr.success(TAPi18n.__('Copied'));
		},
		condition({ msg, subscription, u }) {
			if (subscription == null) {
				return false;
			}

			return msg.starred && msg.starred.find((star) => star._id === u._id);
		},
		order: 101,
		group: 'menu',
	});
});
