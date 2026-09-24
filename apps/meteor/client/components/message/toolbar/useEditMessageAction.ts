import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';

import { useMessageActionsPolicy } from './MessageActionsPolicy';
import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useChat } from '../../../views/room/contexts/ChatContext';

export const useEditMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const chat = useChat();
	const isEditAllowed = policy.settings.allowEditing ?? true;
	const canEditMessage = policy.permissions.editMessage;
	const blockEditInMinutes = policy.settings.blockEditInMinutes ?? 0;
	const canBypassBlockTimeLimit = policy.permissions.bypassEditTimeLimit;

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
			const currentTsDiff = message.ts ? differenceInMinutes(new Date(), message.ts) : undefined;
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
