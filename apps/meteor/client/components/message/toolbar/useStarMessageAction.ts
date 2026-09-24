import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageActionsContext';

export const useStarMessageAction = (message: IMessage, { room }: { room: IRoom }): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const allowStarring = policy.settings.allowStarring ?? true;

	const actions = useMessageActions();

	if (!allowStarring || isOmnichannelRoom(room)) {
		return null;
	}

	if (Array.isArray(message.starred) && message.starred.some((star) => star._id === user?._id)) {
		return null;
	}

	return {
		id: 'star-message',
		icon: 'star',
		label: 'Star',
		type: 'interaction',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		async action() {
			await actions.star(message);
		},
		order: 3,
		group: 'menu',
	};
};
