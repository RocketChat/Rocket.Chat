import type { IMessage } from '@rocket.chat/core-typings';
import { getNextPageOffset } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const PinnedMessagesTab = () => {
	const getPinnedMessages = useEndpoint('GET', '/v1/chat.getPinnedMessages');

	const room = useRoom();

	const pinnedMessagesQueryResult = useQuery({
		queryKey: ['rooms', room._id, 'pinned-messages'] as const,

		queryFn: async () => {
			const messages: IMessage[] = [];

			let offset: number | undefined = 0;

			while (offset !== undefined) {
				const result = await getPinnedMessages({ roomId: room._id, offset });
				messages.push(...result.messages.map(mapMessageFromApi));
				offset = getNextPageOffset(result);
			}

			return Promise.all(messages.map(onClientMessageReceived));
		},
	});

	const { t } = useTranslation();

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
