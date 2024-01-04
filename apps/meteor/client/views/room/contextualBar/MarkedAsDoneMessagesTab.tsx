import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';
import MessageListTab from './MessageListTab';

const MarkedAsDoneMessagesTab = () => {
	const getMarkedAsDoneMessages = useEndpoint('GET', '/v1/chat.getMarkedAsDoneMessages'); // TODO

	const room = useRoom();

	const markedAsDoneMessagesQueryResult = useQuery(['rooms', room._id, 'marked-as-done-messages'] as const, async () => {
		const messages: IMessage[] = [];

		for (
			let offset = 0, result = await getMarkedAsDoneMessages({ roomId: room._id, offset: 0 });
			result.count > 0;
			// eslint-disable-next-line no-await-in-loop
			offset += result.count, result = await getMarkedAsDoneMessages({ roomId: room._id, offset })
		) {
			messages.push(...result.messages.map(mapMessageFromApi));
		}

		return messages;
	});

	return (
		<MessageListTab
			iconName='checkmark-circled'
			title={"Messages marked as done"}
			emptyResultMessage={"No messages marked as done"}
			context='message' // TODO
			queryResult={markedAsDoneMessagesQueryResult}
		/>
	);
};

export default MarkedAsDoneMessagesTab;
