import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Rooms, Subscriptions } from '/app/models';
import { MessageAction } from '/app/ui-utils';
import { EmojiPicker } from '/app/emoji';
import { tooltip } from '/app/tooltip';

Template.room.events({
	'click .add-reaction, click [data-message-action="reaction-message"]'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);

		const user = Meteor.user();
		const room = Rooms.findOne({ _id: data._arguments[1].rid });

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
			return false;
		}

		EmojiPicker.open(event.currentTarget, (emoji) => {
			Meteor.call('setReaction', `:${ emoji }:`, data._arguments[1]._id);
		});
	},

	'click .reactions > li:not(.add-reaction)'(event) {
		event.preventDefault();
		const data = Blaze.getData(event.currentTarget);
		Meteor.call('setReaction', $(event.currentTarget).data('emoji'), data._arguments[1]._id, () => {
			tooltip.hide();
		});
	},

	'mouseenter .reactions > li:not(.add-reaction)'(event) {
		event.stopPropagation();
		tooltip.showElement($(event.currentTarget).find('.people').get(0), event.currentTarget);
	},

	'mouseleave .reactions > li:not(.add-reaction)'(event) {
		event.stopPropagation();
		tooltip.hide();
	},
});

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'reaction-message',
		icon: 'add-reaction',
		label: 'Reactions',
		context: [
			'message',
			'message-mobile',
		],
		action(event) {
			event.stopPropagation();
			EmojiPicker.open(event.currentTarget, (emoji) => Meteor.call('setReaction', `:${ emoji }:`, this._arguments[1]._id));
		},
		condition(message) {
			const room = Rooms.findOne({ _id: message.rid });
			const user = Meteor.user();

			if (!room) {
				return false;
			} else if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
				return false;
			} else if (!Subscriptions.findOne({ rid: message.rid })) {
				return false;
			} else if (message.private) {
				return false;
			}

			return true;
		},
		order: 22,
		group: 'message',
	});
});
