import type { ISubscription, IRoom, IMessage } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageListContext';

export const useReportMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const actions = useMessageActions();

	const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);

	if (!subscription) {
		return null;
	}

	if (isLivechatRoom || message.u._id === user?._id) {
		return null;
	}

	return {
		id: 'report-message',
		icon: 'report',
		label: 'Report',
		context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		variant: 'danger',
		type: 'management',
		action() {
			actions.report(message);
		},
		order: 9,
		group: 'menu',
	};
};
