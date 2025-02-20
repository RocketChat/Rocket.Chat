import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { usePermission, useSetting, useUser } from '@rocket.chat/ui-contexts';
import moment from 'moment';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useChat } from '../../../views/room/contexts/ChatContext';

export const useEditMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const user = useUser();
	const chat = useChat();
	const isEditAllowed = useSetting('Message_AllowEditing', true);
	const canEditMessage = usePermission('edit-message', message.rid);
	const blockEditInMinutes = useSetting('Message_AllowEditing_BlockEditInMinutes', 0);
	const canBypassBlockTimeLimit = usePermission('bypass-time-limit-edit-and-delete', message.rid);

	if (!subscription) {
		return null;
	}

	const condition = (() => {
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
	})();

	if (!condition) {
		return null;
	}

	return {
		id: 'edit-message',
		icon: 'edit',
		label: 'Edit',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		type: 'management',
		async action() {
			await chat?.messageEditing.editMessage(message);
		},
		order: 8,
		group: 'menu',
	};
};
