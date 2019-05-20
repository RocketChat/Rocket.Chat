import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { Rooms } from '../../models';
import { MessageAction } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { EmojiPicker } from '../../emoji';
import { tooltip } from '../../tooltip';

Template.room.events({
	'click .add-reaction, click [data-message-action="reaction-message"]'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);
		const { msg: { rid, _id: mid } } = messageArgs(data);
		const user = Meteor.user();
		const room = Rooms.findOne({ _id: rid });

		if (room.ro && !room.reactWhenReadOnly) {
			if (!Array.isArray(room.unmuted) || room.unmuted.indexOf(user.username) === -1) {
				return false;
			}
		}

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
			return false;
		}

		EmojiPicker.open(event.currentTarget, (emoji) => {
			Meteor.call('setReaction', `:${ emoji }:`, mid);
		});
	},

	'click .reactions > li:not(.add-reaction)'(event) {
		event.preventDefault();

		const data = Blaze.getData(event.currentTarget);
		const { msg: { _id: mid } } = messageArgs(data);
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
			'threads',
		],
		action(event) {
			event.stopPropagation();
			const { msg } = messageArgs(this);
			EmojiPicker.open(event.currentTarget, (emoji) => Meteor.call('setReaction', `:${ emoji }:`, msg._id));
		},
		condition({ msg: message, u: user, room, subscription }) {

			if (!room) {
				return false;
			}

			if (room.ro && !room.reactWhenReadOnly) {
				if (!Array.isArray(room.unmuted) || room.unmuted.indexOf(user.username) === -1) {
					return false;
				}
			}

			if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
				return false;
			} else if (!subscription) {
				return false;
			}

			if (message.private) {
				return false;
			}

			return true;
		},
		order: 22,
		group: 'message',
	});
});
