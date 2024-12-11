import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { usePermission, useSetting, useUser } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import { useChat } from '../../../views/room/contexts/ChatContext';

export const useEditMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
) => {
	const user = useUser();
	const chat = useChat();
	const isEditAllowed = useSetting('Message_AllowEditing', true);
	const canEditMessage = usePermission('edit-message', message.rid);
	const blockEditInMinutes = useSetting('Message_AllowEditing_BlockEditInMinutes', 0);
	const canBypassBlockTimeLimit = usePermission('bypass-time-limit-edit-and-delete', message.rid);

	useEffect(() => {
		if (!subscription) {
			return;
		}

		MessageAction.addButton({
			id: 'edit-message',
			icon: 'edit',
			label: 'Edit',
			context: ['message', 'message-mobile', 'threads', 'federated'],
			type: 'management',
			async action() {
				await chat?.messageEditing.editMessage(message);
			},
			condition() {
				if (isRoomFederated(room)) {
					return message.u._id === user?._id;
				}

				const editOwn = message.u && message.u._id === user?._id;
				if (!canEditMessage && (!isEditAllowed || !editOwn)) {
					return false;
				}

				if (!canBypassBlockTimeLimit && blockEditInMinutes) {
					const msgTs = message.ts ? moment(message.ts) : undefined;
					const currentTsDiff = msgTs ? moment().diff(msgTs, 'minutes') : undefined;
					return typeof currentTsDiff === 'number' && currentTsDiff < blockEditInMinutes;
				}

				return true;
			},
			order: 8,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('edit-message');
		};
	}, [
		blockEditInMinutes,
		canBypassBlockTimeLimit,
		canEditMessage,
		chat?.messageEditing,
		isEditAllowed,
		message,
		room,
		subscription,
		user?._id,
	]);
};
