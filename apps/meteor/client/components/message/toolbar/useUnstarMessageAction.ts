import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageListContext';

export const useUnstarMessageAction = (message: IMessage, { room }: { room: IRoom }): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const { allowStarring } = policy.settings;

	const actions = useMessageActions();

	if (!allowStarring || isOmnichannelRoom(room)) {
		return null;
	}

	if (!Array.isArray(message.starred) || message.starred.every((star) => star._id !== user?._id)) {
		return null;
	}

	return {
		id: 'unstar-message',
		icon: 'star',
		label: 'Unstar_Message',
		type: 'interaction',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		async action() {
			await actions.unstar(message);
		},
		order: 3,
		group: 'menu',
	};
};
