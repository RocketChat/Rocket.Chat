import type { IMessage } from '@rocket.chat/core-typings';
import { useEffect, useState } from 'react';

import PlaceholderMessage from './PlaceholderMessage';
import { useFakeMessageSource } from './useFakeMessageSource';
import MessageList from '../MessageList';
import MessageListDateBubble from '../MessageListDateBubble';
import type { MessageListPosition } from '../lib/position';

export type RoomListProps = {
	history: IMessage[];
	/** How long the messages take to arrive after the list mounts. */
	loadDelay?: number;
	restoredPosition: MessageListPosition | undefined;
	onPositionChange: (position: MessageListPosition) => void;
};

const RoomList = ({ history, loadDelay = 0, restoredPosition, onPositionChange }: RoomListProps) => {
	const source = useFakeMessageSource({ history, pageSize: history.length, latency: 0 });
	const [isReady, setIsReady] = useState(loadDelay === 0);

	useEffect(() => {
		const timeout = setTimeout(() => setIsReady(true), loadDelay);
		return () => clearTimeout(timeout);
	}, [loadDelay]);

	return (
		<MessageList<IMessage>
			aria-label='Message list'
			messages={isReady ? source.messages : []}
			isLoadingInitialMessages={!isReady}
			restoredPosition={restoredPosition}
			onPositionChange={onPositionChange}
			renderMessage={(row) => <PlaceholderMessage message={row.message} isSequential={row.isSequential} />}
		>
			<MessageListDateBubble />
		</MessageList>
	);
};

export default RoomList;
