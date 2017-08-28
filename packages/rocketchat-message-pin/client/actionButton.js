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
			return Meteor.call('pinMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			} else if (message.pinned || !RocketChat.settings.get('Message_AllowPinning')) {
				return false;
			}
			return RocketChat.authz.hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 20,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'unpin-message',
		icon: 'pin',
		label: 'Unpin_Message',
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
		condition(message) {
			if ((RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) && (!message.pinned || !RocketChat.settings.get('Message_AllowPinning'))) {
				return false;
			}

			RocketChat.authz.hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 21,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'jump-to-pin-message',
		icon: 'right-hand',
		label: 'Jump_to_message',
		context: ['pinned'],
		action() {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}
			return true;
		},
		order: 100,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'permalink-pinned',
		icon: 'link',
		label: 'Permalink',
		classes: 'clipboard',
		context: ['pinned'],
		action(event) {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			$(event.currentTarget).attr('data-clipboard-text', RocketChat.MessageAction.getPermaLink(message._id));
			toastr.success(TAPi18n.__('Copied'));
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}
			return true;
		},
		order: 101,
		group: 'menu'
	});
});
