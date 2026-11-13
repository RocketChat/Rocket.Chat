import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { usePermission, useSetModal, useSetting, useUser, useUserSubscription } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import CreateDiscussion from '../../CreateDiscussion';

export const useNewDiscussionMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const user = useUser();
	const enabled = useSetting('Discussion_enabled', true);

	const setModal = useSetModal();

	const canStartDiscussion = usePermission('start-discussion', room._id);
	const canStartDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);

	const parentRoomId = room.prid || room._id;
	const isParentRoomMember = Boolean(useUserSubscription(parentRoomId));

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

	if (!subscription || !isParentRoomMember) {
		return null;
	}

	const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
	if (isLivechatRoom) {
		return null;
	}

	if (isRoomFederated(room)) {
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
					defaultParentRoom={parentRoomId}
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
