import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ISubscription, IMessage, IRoom } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageListContext';

export const useMarkAsUnreadMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const actions = useMessageActions();

	if (isOmnichannelRoom(room) || !user) {
		return null;
	}

	if (!subscription) {
		return null;
	}

	if (message.u._id === user._id) {
		return null;
	}

	return {
		id: 'mark-message-as-unread',
		icon: 'flag',
		label: 'Mark_unread',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		type: 'interaction',
		async action() {
			await actions.markAsUnread(message, subscription);
		},
		order: 4,
		group: 'menu',
	};
};
