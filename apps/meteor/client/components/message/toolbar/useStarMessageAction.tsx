import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { toggleStarredMessage } from '../../../lib/mutationEffects/starredMessage';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const useStarMessageAction = (room: IRoom) => {
	const dispatchToastMessage = useToastMessageDispatch();

	const allowStarring = useSetting('Message_AllowStarring');

	const queryClient = useQueryClient();

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
				try {
					await sdk.rest.post('/v1/chat.starMessage', { messageId: message._id });
					toggleStarredMessage(message, true);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				} finally {
					queryClient.invalidateQueries(roomsQueryKeys.starredMessages(message.rid));
					queryClient.invalidateQueries(roomsQueryKeys.messageActions(message.rid, message._id));
				}
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
	}, [allowStarring, dispatchToastMessage, queryClient, room]);
};
