import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat, handleError } from 'meteor/rocketchat:lib';
import { RoomHistoryManager } from 'meteor/rocketchat:ui';
import toastr from 'toastr';

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin_Message',
		context: ['pinned', 'message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			message.pinned = true;
			Meteor.call('pinMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		condition(message) {
			if	(!RocketChat.settings.get('Message_AllowPinning') || message.pinned || !RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}

			return RocketChat.authz.hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 20,
		group: 'menu',
	});

	RocketChat.MessageAction.addButton({
		id: 'unpin-message',
		icon: 'pin',
		label: 'Unpin_Message',
		context: ['pinned', 'message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			message.pinned = false;
			Meteor.call('unpinMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		condition(message) {
			if	(!RocketChat.settings.get('Message_AllowPinning') || !message.pinned || !RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}

			return RocketChat.authz.hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 21,
		group: 'menu',
	});

	RocketChat.MessageAction.addButton({
		id: 'jump-to-pin-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['pinned'],
		action() {
			const message = this._arguments[1];
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		condition(message) {
			if (!RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}
			return true;
		},
		order: 100,
		group: 'menu',
	});

	RocketChat.MessageAction.addButton({
		id: 'permalink-pinned',
		icon: 'permalink',
		label: 'Permalink',
		classes: 'clipboard',
		context: ['pinned'],
		async action(event) {
			const message = this._arguments[1];
			$(event.currentTarget).attr('data-clipboard-text', await RocketChat.MessageAction.getPermaLink(message._id));
			toastr.success(TAPi18n.__('Copied'));
		},
		condition(message) {
			if (!RocketChat.models.Subscriptions.findOne({ rid: message.rid }, { fields: { _id: 1 } })) {
				return false;
			}
			return true;
		},
		order: 101,
		group: 'menu',
	});
});
