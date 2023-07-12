import { Meteor } from 'meteor/meteor';

import { messageArgs } from '../../../client/lib/utils/messageArgs';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { sdk } from '../../utils/client/lib/SDKClient';
import { ui } from '../../../client/lib/ui';

Meteor.startup(() => {
	ui.addMessageAction({
		id: 'reaction-message',
		icon: 'add-reaction',
		label: 'Add_Reaction',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		action(event, props) {
			event.stopPropagation();
			const { message = messageArgs(this).msg, chat } = props;
			chat?.emojiPicker.open(event.currentTarget, (emoji) => sdk.call('setReaction', `:${emoji}:`, message._id));
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
		order: -3,
		group: ['message', 'menu'],
	});
});
