import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';
import MessageListTab from './MessageListTab';

const MentionsTab = (): ReactElement => {
	const getMentionedMessages = useEndpoint('GET', '/v1/chat.getMentionedMessages');

	const room = useRoom();

	const mentionedMessagesQueryResult = useQuery(['rooms', room._id, 'mentioned-messages'] as const, async () => {
		const messages: IMessage[] = [];

		for (
			let offset = 0, result = await getMentionedMessages({ roomId: room._id, offset: 0 });
			result.count > 0;
			// eslint-disable-next-line no-await-in-loop
			offset += result.count, result = await getMentionedMessages({ roomId: room._id, offset })
		) {
			messages.push(...result.messages.map(mapMessageFromApi));
		}

		return messages;
	});

	const t = useTranslation();

	return (
		<MessageListTab
			iconName='at'
			title={t('Mentions')}
			emptyResultMessage={t('No_mentions_found')}
			context='mentions'
			queryResult={mentionedMessagesQueryResult}
		/>
	);
};

export default MentionsTab;
