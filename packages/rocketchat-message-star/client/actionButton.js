import _ from 'underscore';
import toastr from 'toastr';

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'star-message',
		icon: 'star',
		label: 'Star_Message',
		context: ['starred', 'message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			message.starred = Meteor.userId();
			Meteor.call('starMessage', message, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null && RocketChat.settings.get('Message_AllowStarring')) {
				return false;
			}

			return !_.findWhere(message.starred, {_id: Meteor.userId()});
		},
		order: 10,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'unstar-message',
		icon: 'star',
		label: 'Unstar_Message',
		context: ['starred', 'message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			message.starred = false;
			Meteor.call('starMessage', message, function(error) {
				if (error) {
					handleError(error);
				}
			});
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null && RocketChat.settings.get('Message_AllowStarring')) {
				return false;
			}

			return Boolean(_.findWhere(message.starred, {_id: Meteor.userId()}));
		},
		order: 10,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'jump-to-star-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['starred'],
		action() {
			const message = this._arguments[1];
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			RoomHistoryManager.getSurroundingMessages(message, 50);
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
		id: 'permalink-star',
		icon: 'permalink',
		label: 'Permalink',
		classes: 'clipboard',
		context: ['starred'],
		action(event) {
			const message = this._arguments[1];
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
