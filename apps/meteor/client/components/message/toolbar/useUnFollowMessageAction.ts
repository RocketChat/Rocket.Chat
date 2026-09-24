import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import type { MessageActionContext, MessageActionConfig } from '../../../lib/MessageAction';
import { Messages } from '../../../stores';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageActionsContext';

export const useUnFollowMessageAction = (
	message: IMessage,
	{ room, context }: { room: IRoom; context: MessageActionContext },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const { threadsEnabled } = policy.settings;

	const actions = useMessageActions();

	const { tmid, _id } = message;
	const parentMessage = Messages.use((state) => state.find((record) => record._id === tmid || record._id === _id));

	if (!message || !threadsEnabled || isOmnichannelRoom(room)) {
		return null;
	}

	let { replies } = message;

	if (tmid || context) {
		if (parentMessage) {
			replies = parentMessage.replies || [];
		}
	}

	if (!user?._id) {
		return null;
	}

	if (!replies?.includes(user._id)) {
		return null;
	}

	return {
		id: 'unfollow-message',
		icon: 'bell-off',
		label: 'Unfollow_message',
		type: 'interaction',
		context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		action() {
			actions.setFollowing(message, room, false);
		},
		order: 1,
		group: 'menu',
	};
};
