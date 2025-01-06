import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const PinnedMessagesTab = (): ReactElement => {
	const getPinnedMessages = useEndpoint('GET', '/v1/chat.getPinnedMessages');

	const room = useRoom();

	const pinnedMessagesQueryResult = useQuery({
		queryKey: ['rooms', room._id, 'pinned-messages'] as const,

		queryFn: async () => {
			const messages: IMessage[] = [];

			for (
				let offset = 0, result = await getPinnedMessages({ roomId: room._id, offset: 0 });
				result.count > 0;
				// eslint-disable-next-line no-await-in-loop
				offset += result.count, result = await getPinnedMessages({ roomId: room._id, offset })
			) {
				messages.push(...result.messages.map(mapMessageFromApi));
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
