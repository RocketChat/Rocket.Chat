import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageListContext';

export const useUnpinMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { allowPinning } = policy.settings;
	const hasPermission = policy.permissions.pinMessage;

	const actions = useMessageActions();

	if (!allowPinning || isOmnichannelRoom(room) || !hasPermission || !message.pinned || !subscription) {
		return null;
	}

	return {
		id: 'unpin-message',
		icon: 'pin',
		label: 'Unpin',
		type: 'interaction',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		action() {
			actions.unpin(message);
		},
		order: 2,
		group: 'menu',
	};
};
