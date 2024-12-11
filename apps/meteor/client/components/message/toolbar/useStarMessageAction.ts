import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useStarMessageMutation } from '../hooks/useStarMessageMutation';

export const useStarMessageAction = (message: IMessage, { room, user }: { room: IRoom; user: IUser | undefined }) => {
	const allowStarring = useSetting('Message_AllowStarring', true);

	const { mutateAsync: starMessage } = useStarMessageMutation();

	useEffect(() => {
		if (!allowStarring || isOmnichannelRoom(room)) {
			return;
		}

		if (Array.isArray(message.starred) && message.starred.some((star) => star._id === user?._id)) {
			return;
		}

		MessageAction.addButton({
			id: 'star-message',
			icon: 'star',
			label: 'Star',
			type: 'interaction',
			context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			async action() {
				await starMessage(message);
			},
			order: 3,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('star-message');
		};
	}, [allowStarring, message, room, starMessage, user?._id]);
};
