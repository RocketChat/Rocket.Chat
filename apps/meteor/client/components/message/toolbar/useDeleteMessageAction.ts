import { isRoomFederated } from '@rocket.chat/core-typings';
import type { ISubscription, IRoom, IMessage } from '@rocket.chat/core-typings';
import { useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useChat } from '../../../views/room/contexts/ChatContext';

export const useDeleteMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const user = useUser();
	const chat = useChat();

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

			return chat?.data.canDeleteMessage(message) ?? false;
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
		color: 'alert',
		type: 'management',
		async action() {
			await chat?.flows.requestMessageDeletion(message);
		},
		order: 10,
		group: 'menu',
	};
};
