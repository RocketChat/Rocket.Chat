import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { toggleStarredMessage } from '../../../lib/mutationEffects/starredMessage';
import { queryClient } from '../../../lib/queryClient';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const useUnstarMessageAction = (room: IRoom) => {
	const dispatchToastMessage = useToastMessageDispatch();

	const allowStaring = useSetting('Message_AllowStarring');

	useEffect(() => {
		if (!allowStaring || isOmnichannelRoom(room)) {
			return () => {
				MessageAction.removeButton('unstar-message');
			};
		}

		MessageAction.addButton({
			id: 'unstar-message',
			icon: 'star',
			label: 'Unstar_Message',
			type: 'interaction',
			context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			async action(_, { message }) {
				try {
					await sdk.rest.post('/v1/chat.unStarMessage', { messageId: message._id });
					toggleStarredMessage(message, false);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				} finally {
					queryClient.invalidateQueries(roomsQueryKeys.starredMessages(message.rid));
					queryClient.invalidateQueries(roomsQueryKeys.messageActions(message.rid, message._id));
				}
			},
			condition({ message, user }) {
				return Boolean(message.starred?.find((star: any) => star._id === user?._id));
			},
			order: 3,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('unstar-message');
		};
	}, [allowStaring, dispatchToastMessage]);
};
