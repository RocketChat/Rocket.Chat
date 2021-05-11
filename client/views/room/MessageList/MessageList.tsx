import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import { isSameDay } from 'date-fns';
import React, { FC, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { IRoom } from '../../../../definition/IRoom';
import RoomForeword from '../../../components/RoomForeword';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useRoom, useRoomContext } from '../providers/RoomProvider';
import Message from './components/Message';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';

export const MessageList: FC = () => {
	const room = useRoom() as IRoom;

	const prepending = useRef(0);

	const messages = useMessages({ rid: room._id });

	const format = useFormatDateAndTime();
	const { getMore } = useRoomContext();

	const [firstItemIndex, setFirstItemIndex] = useState(messages.length);

	const more = useCallback(() => {
		prepending.current = messages.length;
		getMore();
	}, [getMore, messages.length]);

	useLayoutEffect(() => {
		if (prepending.current) {
			setFirstItemIndex((old) => messages.length - old);
			prepending.current = 0;
		}
	}, [messages.length]);

	const itemContent = useCallback(
		(_, message) => {
			const index = messages.findIndex((m) => m === message);
			const previous = messages[index - 1];

			const sequential = isMessageSequential(message, previous);

			const newDay = !previous || !isSameDay(message.ts, previous.ts);
			return (
				<>
					{newDay && <MessageTemplate.Divider>{format(message.ts)}</MessageTemplate.Divider>}
					<Message sequential={sequential} message={message} key={message._id} />
				</>
			);
		},
		[messages],
	);

	console.log(firstItemIndex);
	return (
		<Virtuoso
			overscan={50}
			firstItemIndex={firstItemIndex}
			totalCount={Math.max(messages.length, Math.min(300, room.msgs))}
			data={messages}
			defaultItemHeight={49}
			components={{
				Scroller: ScrollableContentWrapper as any,
				Header: () => <RoomForeword rid={room._id} />,
			}}
			followOutput
			startReached={more}
			itemContent={itemContent}
		/>
	);
};
