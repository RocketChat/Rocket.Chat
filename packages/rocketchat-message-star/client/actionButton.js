import toastr from 'toastr';
Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'star-message',
		icon: 'icon-star-empty',
		i18nLabel: 'Star_Message',
		context: ['starred', 'message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			message.starred = Meteor.userId();
			return Meteor.call('starMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null && RocketChat.settings.get('Message_AllowStarring')) {
				return false;
			}

			return !_.findWhere(message.starred, {_id: Meteor.userId()});
		},
		order: 10
	});
	RocketChat.MessageAction.addButton({
		id: 'unstar-message',
		icon: 'icon-star',
		i18nLabel: 'Unstar_Message',
		context: ['starred', 'message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			message.starred = false;
			return Meteor.call('starMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null && RocketChat.settings.get('Message_AllowStarring')) {
				return false;
			}

			return Boolean(_.findWhere(message.starred, {_id: Meteor.userId()}));
		},
		order: 10
	});
	RocketChat.MessageAction.addButton({
		id: 'jump-to-star-message',
		icon: 'icon-right-hand',
		i18nLabel: 'Jump_to_message',
		context: ['starred'],
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
		id: 'permalink-star',
		icon: 'icon-link',
		i18nLabel: 'Permalink',
		classes: 'clipboard',
		context: ['starred'],
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
