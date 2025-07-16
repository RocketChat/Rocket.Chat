import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { usePermission, useSetModal, useSetting, useUser } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import CreateDiscussion from '../../CreateDiscussion';

export const useNewDiscussionMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const user = useUser();
	const enabled = useSetting('Discussion_enabled', false);

	const setModal = useSetModal();

	const canStartDiscussion = usePermission('start-discussion', room._id);
	const canStartDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);

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
				/>,
			);
		},
		order: 1,
		group: 'menu',
	};
};
