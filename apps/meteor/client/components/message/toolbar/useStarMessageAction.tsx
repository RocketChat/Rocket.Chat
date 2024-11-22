import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useStarMessageMutation } from '../hooks/useStarMessageMutation';

export const useStarMessageAction = (room: IRoom) => {
	const allowStarring = useSetting('Message_AllowStarring');

	const { mutateAsync: starMessage } = useStarMessageMutation();

	useEffect(() => {
		if (!allowStarring || isOmnichannelRoom(room)) {
			return () => {
				MessageAction.removeButton('star-message');
			};
		}

		MessageAction.addButton({
			id: 'star-message',
			icon: 'star',
			label: 'Star',
			type: 'interaction',
			context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			async action(_, { message }) {
				await starMessage(message);
			},
			condition({ message, user }) {
				return !Array.isArray(message.starred) || !message.starred.find((star: any) => star._id === user?._id);
			},
			order: 3,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('star-message');
		};
	}, [allowStarring, room, starMessage]);
};
