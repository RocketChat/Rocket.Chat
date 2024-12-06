import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { usePermission, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import CreateDiscussion from '../../CreateDiscussion';

export const useNewDiscussionMessageAction = (
	message: IMessage,
	{ user, room, subscription }: { user: IUser | undefined; room: IRoom; subscription: ISubscription | undefined },
) => {
	const enabled = useSetting('Discussion_enabled', false);

	const setModal = useSetModal();

	const canStartDiscussion = usePermission('start-discussion', room._id);
	const canStartDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const {
			u: { _id: uid },
			drid,
			dcount,
		} = message;
		if (drid || !Number.isNaN(Number(dcount))) {
			return;
		}

		if (!subscription) {
			return;
		}

		const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
		if (isLivechatRoom) {
			return;
		}

		if (!user) {
			return;
		}

		if (!(uid !== user._id ? canStartDiscussionOtherUser : canStartDiscussion)) {
			return;
		}

		MessageAction.addButton({
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
		});

		return () => {
			MessageAction.removeButton('start-discussion');
		};
	}, [canStartDiscussion, canStartDiscussionOtherUser, enabled, message, room?._id, room?.prid, room.t, setModal, subscription, user]);
};
