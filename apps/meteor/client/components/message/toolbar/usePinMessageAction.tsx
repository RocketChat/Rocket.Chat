import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageListContext';

export const usePinMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const actions = useMessageActions();

	const { allowPinning } = policy.settings;
	const hasPermission = policy.permissions.pinMessage;

	if (!allowPinning || isOmnichannelRoom(room) || !hasPermission || message.pinned || !subscription) {
		return null;
	}

	return {
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin',
		type: 'interaction',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		async action() {
			actions.pin(message);
		},
		order: 2,
		group: 'menu',
	};
};
