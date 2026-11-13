import type { IMessage } from '@rocket.chat/core-typings';

import PlaceholderMessage from './PlaceholderMessage';
import { useFakeMessageSource } from './useFakeMessageSource';
import MessageList from '../MessageList';
import MessageListDateBubble from '../MessageListDateBubble';
import type { MessageListPosition } from '../lib/position';

export type RoomListProps = {
	history: IMessage[];
	restoredPosition: MessageListPosition | undefined;
	onPositionChange: (position: MessageListPosition) => void;
};

const RoomList = ({ history, restoredPosition, onPositionChange }: RoomListProps) => {
	const source = useFakeMessageSource({ history, pageSize: history.length, latency: 0 });

	return (
		<MessageList<IMessage>
			aria-label='Message list'
			messages={source.messages}
			restoredPosition={restoredPosition}
			onPositionChange={onPositionChange}
			renderMessage={(row) => <PlaceholderMessage message={row.message} isSequential={row.isSequential} />}
		>
			<MessageListDateBubble />
		</MessageList>
	);
};

export default RoomList;
