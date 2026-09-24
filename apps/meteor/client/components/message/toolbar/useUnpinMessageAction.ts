import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { useMessageActionsPolicy } from './MessageActionsPolicy';
import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useUnpinMessageMutation } from '../hooks/useUnpinMessageMutation';

export const useUnpinMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { allowPinning } = policy.settings;
	const hasPermission = policy.permissions.pinMessage;

	const { mutate: unpinMessage } = useUnpinMessageMutation();

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
			unpinMessage(message);
		},
		order: 2,
		group: 'menu',
	};
};
