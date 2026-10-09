import type { IMessage } from '@rocket.chat/core-typings';
import { getNextPageOffset } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const MentionsTab = () => {
	const getMentionedMessages = useEndpoint('GET', '/v1/chat.getMentionedMessages');

	const room = useRoom();

	const mentionedMessagesQueryResult = useQuery({
		queryKey: ['rooms', room._id, 'mentioned-messages'] as const,

		queryFn: async () => {
			const messages: IMessage[] = [];

			let offset: number | undefined = 0;

			while (offset !== undefined) {
				const result = await getMentionedMessages({ roomId: room._id, offset });
				messages.push(...result.messages.map(mapMessageFromApi));
				offset = getNextPageOffset(result);
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
