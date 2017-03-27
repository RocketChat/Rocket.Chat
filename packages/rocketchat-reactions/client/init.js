Template.room.events({
	'click .add-reaction'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);

		const user = Meteor.user();
		const room = RocketChat.models.Rooms.findOne({ _id: data._arguments[1].rid });

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
			return false;
		}

		RocketChat.EmojiPicker.open(event.currentTarget, (emoji) => {
			Meteor.call('setReaction', `:${ emoji }:`, data._arguments[1]._id);
		});
	},

	'click .reactions > li:not(.add-reaction)'(event) {
		event.preventDefault();
		const data = Blaze.getData(event.currentTarget);
		Meteor.call('setReaction', $(event.currentTarget).data('emoji'), data._arguments[1]._id, () => {
			RocketChat.tooltip.hide();
		});
	},

	'mouseenter .reactions > li:not(.add-reaction)'(event) {
		event.stopPropagation();
		RocketChat.tooltip.showElement($(event.currentTarget).find('.people').get(0), event.currentTarget);
	},

	'mouseleave .reactions > li:not(.add-reaction)'(event) {
		event.stopPropagation();
		RocketChat.tooltip.hide();
	}
});

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'reaction-message',
		icon: 'icon-people-plus',
		i18nLabel: 'Reactions',
		context: [
			'message',
			'message-mobile'
		],
		action(event) {
			const data = Blaze.getData(event.currentTarget);

			event.stopPropagation();

			RocketChat.EmojiPicker.open(event.currentTarget, (emoji) => {
				Meteor.call('setReaction', `:${ emoji }:`, data._arguments[1]._id);
			});
		},
		validation(message) {
			const room = RocketChat.models.Rooms.findOne({ _id: message.rid });
			const user = Meteor.user();

			if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
				return false;
			} else if (!RocketChat.models.Subscriptions.findOne({ rid: message.rid })) {
				return false;
			} else if (message.private) {
				return false;
			}

			return true;
		},
		order: 22
	});
});
