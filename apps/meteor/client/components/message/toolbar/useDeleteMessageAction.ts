import { isRoomFederated } from '@rocket.chat/core-typings';
import type { ISubscription, IUser, IRoom, IMessage } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useChat } from '../../../views/room/contexts/ChatContext';

export const useDeleteMessageAction = (
	message: IMessage,
	{ user, room, subscription }: { user: IUser | undefined; room: IRoom; subscription: ISubscription | undefined },
) => {
	const chat = useChat();

	useEffect(() => {
		if (!subscription) {
			return;
		}

		MessageAction.addButton({
			id: 'delete-message',
			icon: 'trash',
			label: 'Delete',
			context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			color: 'alert',
			type: 'management',
			async action() {
				await chat?.flows.requestMessageDeletion(message);
			},
			condition() {
				if (isRoomFederated(room)) {
					return message.u._id === user?._id;
				}

				const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}

				return chat?.data.canDeleteMessage(message) ?? false;
			},
			order: 10,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('delete-message');
		};
	}, [chat?.data, chat?.flows, message, room, subscription, user?._id]);
};
