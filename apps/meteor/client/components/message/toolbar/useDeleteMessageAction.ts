import { isRoomFederated } from '@rocket.chat/core-typings';
import type { ISubscription, IRoom, IMessage } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageActionsContext';

export const useDeleteMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const actions = useMessageActions();

	const { data: condition = false } = useQuery({
		queryKey: ['delete-message', message] as const,
		queryFn: async () => {
			if (!subscription) {
				return false;
			}

			if (isRoomFederated(room)) {
				return message.u._id === user?._id;
			}

			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return policy.canDeleteMessage(message);
		},
	});

	if (!condition) {
		return null;
	}

	return {
		id: 'delete-message',
		icon: 'trash',
		label: 'Delete',
		context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		variant: 'danger',
		type: 'management',
		async action() {
			await actions.requestDeletion(message);
		},
		order: 10,
		group: 'menu',
	};
};
