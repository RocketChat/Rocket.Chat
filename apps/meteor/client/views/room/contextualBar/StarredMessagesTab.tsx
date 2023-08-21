import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';
import MessageListTab from './MessageListTab';

const StarredMessagesTab = () => {
	const getStarredMessages = useEndpoint('GET', '/v1/chat.getStarredMessages');

	const room = useRoom();

	const starredMessagesQueryResult = useQuery(['rooms', room._id, 'starred-messages'] as const, async () => {
		const messages: IMessage[] = [];

		for (
			let offset = 0, result = await getStarredMessages({ roomId: room._id, offset: 0 });
			result.count > 0;
			// eslint-disable-next-line no-await-in-loop
			offset += result.count, result = await getStarredMessages({ roomId: room._id, offset })
		) {
			messages.push(...result.messages.map(mapMessageFromApi));
		}

		return messages;
	});

	const t = useTranslation();

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
