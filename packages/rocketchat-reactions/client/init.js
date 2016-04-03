Template.room.events({
	'click .add-reaction'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);

		RocketChat.EmojiPicker.open(event.currentTarget, (emoji) => {
			Meteor.call('setReaction', ':' + emoji + ':', data._arguments[1]._id);
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

			RocketChat.EmojiPicker.open(event.currentTarget, (emoji) => {
				Meteor.call('setReaction', ':' + emoji + ':', data._arguments[1]._id);
			});
		},
		validation() {
			return true;
		},
		order: 22
	});
});
