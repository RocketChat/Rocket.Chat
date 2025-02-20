import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const StarredMessagesTab = () => {
	const getStarredMessages = useEndpoint('GET', '/v1/chat.getStarredMessages');

	const room = useRoom();

	const starredMessagesQueryResult = useQuery({
		queryKey: roomsQueryKeys.starredMessages(room._id),
		queryFn: async () => {
			const messages: IMessage[] = [];

			for (
				let offset = 0, result = await getStarredMessages({ roomId: room._id, offset: 0 });
				result.count > 0;
				// eslint-disable-next-line no-await-in-loop
				offset += result.count, result = await getStarredMessages({ roomId: room._id, offset })
			) {
				messages.push(...result.messages.map(mapMessageFromApi));
			}

			return Promise.all(messages.map(onClientMessageReceived));
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
