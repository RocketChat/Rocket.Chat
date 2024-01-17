import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';
import MessageListTab from './MessageListTab';

const PinnedMessagesTab = (): ReactElement => {
	const getPinnedMessages = useEndpoint('GET', '/v1/chat.getPinnedMessages');

	const room = useRoom();

	const pinnedMessagesQueryResult = useQuery(['rooms', room._id, 'pinned-messages'] as const, async () => {
		const messages: IMessage[] = [];

		for (
			let offset = 0, result = await getPinnedMessages({ roomId: room._id, offset: 0 });
			result.count > 0;
			// eslint-disable-next-line no-await-in-loop
			offset += result.count, result = await getPinnedMessages({ roomId: room._id, offset })
		) {
			messages.push(...result.messages.map(mapMessageFromApi));
		}

		return messages;
	});

	const t = useTranslation();

	return (
		<MessageListTab
			iconName='pin'
			title={t('Pinned_Messages')}
			emptyResultMessage={t('No_pinned_messages')}
			context='pinned'
			queryResult={pinnedMessagesQueryResult}
		/>
	);
};

export default PinnedMessagesTab;
