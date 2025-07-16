import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const MentionsTab = (): ReactElement => {
	const getMentionedMessages = useEndpoint('GET', '/v1/chat.getMentionedMessages');

	const room = useRoom();

	const mentionedMessagesQueryResult = useQuery({
		queryKey: ['rooms', room._id, 'mentioned-messages'] as const,

		queryFn: async () => {
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
		},
	});

	const { t } = useTranslation();

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
