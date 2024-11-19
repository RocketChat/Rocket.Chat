import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { hasPermission } from '../../../../app/authorization/client';
import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import CreateDiscussion from '../../CreateDiscussion';

export const useNewDiscussionMessageAction = () => {
	const enabled = useSetting('Discussion_enabled', false);

	const setModal = useSetModal();

	useEffect(() => {
		if (!enabled) {
			return MessageAction.removeButton('start-discussion');
		}
		MessageAction.addButton({
			id: 'start-discussion',
			icon: 'discussion',
			label: 'Discussion_start',
			type: 'communication',
			context: ['message', 'message-mobile', 'videoconf'],
			async action(_, { message, room }) {
				setModal(
					<CreateDiscussion
						defaultParentRoom={room?.prid || room?._id}
						onClose={() => setModal(undefined)}
						parentMessageId={message._id}
						nameSuggestion={message?.msg?.substr(0, 140)}
					/>,
				);
			},
			condition({
				message: {
					u: { _id: uid },
					drid,
					dcount,
				},
				room,
				subscription,
				user,
			}) {
				if (drid || !Number.isNaN(Number(dcount))) {
					return false;
				}
				if (!subscription) {
					return false;
				}
				const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}

				if (!user) {
					return false;
				}

				return uid !== user._id ? hasPermission('start-discussion-other-user', room._id) : hasPermission('start-discussion', room._id);
			},
			order: 1,
			group: 'menu',
		});
		return () => {
			MessageAction.removeButton('start-discussion');
		};
	}, [enabled, setModal]);
};
