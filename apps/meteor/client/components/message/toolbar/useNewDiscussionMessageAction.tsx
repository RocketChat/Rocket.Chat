import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';

import { useMessageActionsPolicy } from './MessageActionsPolicy';
import type { MessageActionConfig } from '../../../lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import CreateDiscussion from '../../CreateDiscussion';

export const useNewDiscussionMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const enabled = policy.settings.discussionEnabled ?? false;

	const setModal = useSetModal();

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
			setModal(
				<CreateDiscussion
					defaultParentRoom={room?.prid || room?._id}
					onClose={() => setModal(undefined)}
					parentMessageId={message._id}
					nameSuggestion={message?.msg?.substr(0, 140)}
					encryptedParentRoom={room?.encrypted}
				/>,
			);
		},
		order: 1,
		group: 'menu',
	};
};
