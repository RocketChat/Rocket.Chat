import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';

import { Rooms, Subscriptions } from '../../models/client';
import { MessageAction } from '../../ui-utils';
import { messageArgs } from '../../../client/lib/utils/messageArgs';
import { EmojiPicker } from '../../emoji';
import { tooltip } from '../../ui/client/components/tooltip';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';

export const EmojiEvents = {
	'click .add-reaction'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);
		const {
			msg: { rid, _id: mid, private: isPrivate },
		} = messageArgs(data);
		const user = Meteor.user();
		const room = Rooms.findOne({ _id: rid });

		if (!room) {
			return false;
		}

		if (!Subscriptions.findOne({ rid })) {
			return false;
		}

		if (isPrivate) {
			return false;
		}

		if (roomCoordinator.readOnly(room._id, user) && !room.reactWhenReadOnly) {
			return false;
		}

		EmojiPicker.open(event.currentTarget, (emoji) => {
			Meteor.call('setReaction', `:${emoji}:`, mid);
		});
	},

	'click .reactions > li:not(.add-reaction)'(event) {
		event.preventDefault();

		const data = Blaze.getData(event.currentTarget);
		const {
			msg: { _id: mid },
		} = messageArgs(data);
		Meteor.call('setReaction', $(event.currentTarget).attr('data-emoji'), mid, () => {
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
};

Meteor.startup(function () {
	MessageAction.addButton({
		id: 'reaction-message',
		icon: 'add-reaction',
		label: 'Add_Reaction',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		action(event, props) {
			event.stopPropagation();
			const { message = messageArgs(this).msg } = props;
			EmojiPicker.open(event.currentTarget, (emoji) => Meteor.call('setReaction', `:${emoji}:`, message._id));
		},
		condition({ message, user, room, subscription }) {
			if (!room) {
				return false;
			}

			if (!subscription) {
				return false;
			}

			if (message.private) {
				return false;
			}

			if (roomCoordinator.readOnly(room._id, user) && !room.reactWhenReadOnly) {
				return false;
			}
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return true;
		},
		order: -2,
		group: ['message', 'menu'],
	});
});
