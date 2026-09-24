import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageActionsContext';

export const useNewDiscussionMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const enabled = policy.settings.discussionEnabled ?? false;

	const actions = useMessageActions();

	const canStartDiscussion = policy.permissions.startDiscussion;
	const canStartDiscussionOtherUser = policy.permissions.startDiscussionOtherUser;

	if (!enabled) {
		return null;
	}

	const {
		u: { _id: uid },
		drid,
		dcount,
	} = message;
	if (drid || !Number.isNaN(Number(dcount))) {
		return null;
	}

	if (!subscription) {
		return null;
	}

	const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
	if (isLivechatRoom) {
		return null;
	}

	if (!user) {
		return null;
	}

	if (!(uid !== user._id ? canStartDiscussionOtherUser : canStartDiscussion)) {
		return null;
	}

	return {
		id: 'start-discussion',
		icon: 'discussion',
		label: 'Discussion_start',
		type: 'communication',
		context: ['message', 'message-mobile', 'videoconf'],
		async action() {
			actions.startDiscussion(message, room);
		},
		order: 1,
		group: 'menu',
	};
};
