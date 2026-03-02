import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const StarredMessagesTab = () => {
	const getStarredMessages = useEndpoint('GET', '/v1/chat.getStarredMessages');

	const room = useRoom();

	const starredMessagesQueryResult = useInfiniteQuery({
		queryKey: roomsQueryKeys.starredMessages(room._id),
		queryFn: async ({ pageParam: offset = 0 }) => {
			const result = await getStarredMessages({ roomId: room._id, offset, count: 25 });

			
			const messages = await Promise.all(
				result.messages.map(mapMessageFromApi).map(onClientMessageReceived)
			);
			return {
				messages,
				total: result.total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			const loadedCount = allPages.reduce((acc, page) => acc + page.messages.length, 0);
			return loadedCount < lastPage.total ? loadedCount : undefined;
		},
	});

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
