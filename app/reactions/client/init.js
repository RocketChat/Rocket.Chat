import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Rooms, Subscriptions } from '../../models';
import { MessageAction } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';

import { EmojiPicker } from '../../emoji';
import { tooltip } from '../../tooltip';

Template.room.events({
	'click .add-reaction, click [data-message-action="reaction-message"]'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);
		const { msg:{ rid, _id: mid } } = messageArgs(data);
		const user = Meteor.user();
		const room = Rooms.findOne({ _id: rid });

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
			return false;
		}

		EmojiPicker.open(event.currentTarget, (emoji) => {
			Meteor.call('setReaction', `:${ emoji }:`, mid);
		});
	},

	'click .reactions > li:not(.add-reaction)'(event) {
		event.preventDefault();

		const data = Blaze.getData(event.currentTarget);
		const { msg:{ _id: mid } } = messageArgs(data);
		Meteor.call('setReaction', $(event.currentTarget).data('emoji'), mid, () => {
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
			const { msg } = messageArgs(this);
			EmojiPicker.open(event.currentTarget, (emoji) => Meteor.call('setReaction', `:${ emoji }:`, msg._id));
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
