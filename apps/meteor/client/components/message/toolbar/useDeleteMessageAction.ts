import { isRoomFederated } from '@rocket.chat/core-typings';
import type { ISubscription, IRoom, IMessage } from '@rocket.chat/core-typings';
import { useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import type { MessageActionConfig, MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { SelectedMessageContext } from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useChat } from '../../../views/room/contexts/ChatContext';
import { useRoomToolbox } from '../../../views/room/contexts/RoomToolboxContext';

export const useDeleteMessageAction = (
	message: IMessage,
	{ room, subscription, context }: { room: IRoom; subscription: ISubscription | undefined; context: MessageActionContext },
): MessageActionConfig | null => {
	const user = useUser();
	const chat = useChat();

	const { selectedMessageStore } = useContext(SelectedMessageContext);
	const toolbox = useRoomToolbox();

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
			if (context === 'threads' || context === 'videoconf-threads') {
				await chat?.flows.requestMessageDeletion(message);
				return;
			}

			selectedMessageStore.clearStore();

			selectedMessageStore.setIsSelecting(true);

			selectedMessageStore.toggle(message._id);

			toolbox.openTab('multi-delete-messages');
		},
		order: 10,
		group: 'menu',
	};
};
