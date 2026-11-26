import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const StarredMessagesTab = () => {
	const getStarredMessages = useEndpoint('GET', '/v1/chat.getStarredMessages');
	const subscribeToRoomMessages = useStream('room-messages');

	const room = useRoom();
	const queryClient = useQueryClient();

	const starredMessagesQueryResult = useQuery({
		queryKey: roomsQueryKeys.starredMessages(room._id),
		queryFn: async () => {
			const messages: IMessage[] = [];

			for (
				let offset = 0, result = await getStarredMessages({ roomId: room._id, offset: 0 });
				result.count > 0;
				offset += result.count, result = await getStarredMessages({ roomId: room._id, offset })
			) {
				messages.push(...result.messages.map(mapMessageFromApi));
			}

			return Promise.all(messages.map(onClientMessageReceived));
		},
	});

	useEffect(() => {
		const queryKey = roomsQueryKeys.starredMessages(room._id);

		// The list is only fetched once, so keep the messages it already shows in sync with realtime updates (e.g. edits)
		return subscribeToRoomMessages(room._id, async (event) => {
			const isListed = queryClient.getQueryData<IMessage[]>(queryKey)?.some((message) => message._id === event._id);

			if (!isListed) {
				return;
			}

			const updated = await onClientMessageReceived(event);

			queryClient.setQueryData<IMessage[]>(queryKey, (messages) =>
				messages?.map((message) => (message._id === updated._id ? updated : message)),
			);
		});
	}, [queryClient, room._id, subscribeToRoomMessages]);

	const { t } = useTranslation();

	return (
		<MessageListTab
			iconName='star'
			title={t('Starred_Messages')}
			emptyResultMessage={t('No_starred_messages')}
			context='starred'
			queryResult={starredMessagesQueryResult}
		/>
	);
};

export default StarredMessagesTab;
