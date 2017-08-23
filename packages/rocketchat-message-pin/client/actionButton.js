import toastr from 'toastr';

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'pin-message',
		icon: 'icon-pin',
		i18nLabel: 'Pin_Message',
		context: ['pinned', 'message', 'message-mobile'],

		action() {
			const message = this._arguments[1];
			message.pinned = true;
			return Meteor.call('pinMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},

		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			} else if (message.pinned || !RocketChat.settings.get('Message_AllowPinning')) {
				return false;
			}
			return RocketChat.authz.hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 20
	});

	RocketChat.MessageAction.addButton({
		id: 'unpin-message',
		icon: 'icon-pin rotate-45',
		i18nLabel: 'Unpin_Message',
		context: ['pinned', 'message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			message.pinned = false;
			return Meteor.call('unpinMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},

		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			} else if (!message.pinned || !RocketChat.settings.get('Message_AllowPinning')) {
				return false;
			}
			return RocketChat.authz.hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 21
	});

	RocketChat.MessageAction.addButton({
		id: 'jump-to-pin-message',
		icon: 'icon-right-hand',
		i18nLabel: 'Jump_to_message',
		context: ['pinned'],
		action() {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}
			return true;
		},
		order: 100
	});

	return RocketChat.MessageAction.addButton({
		id: 'permalink-pinned',
		icon: 'icon-link',
		i18nLabel: 'Permalink',
		classes: 'clipboard',
		context: ['pinned'],
		action(event) {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			$(event.currentTarget).attr('data-clipboard-text', RocketChat.MessageAction.getPermaLink(message._id));
			return toastr.success(TAPi18n.__('Copied'));
		},

		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}
			return true;
		},
		order: 101
	});
});
