import { Message as MessageTemplate, Box, Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { isSameDay } from 'date-fns';
import React, { FC, useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

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

	const virtuoso = useRef<VirtuosoHandle>(null);


	const messages = useMessages({ rid: room._id });

	const prepending = useRef(0);
	const [firstItemIndex, setFirstItemIndex] = useState(room.msgs);
	const format = useFormatDateAndTime();
	const { getMore } = useRoomContext();

	useEffect(() => {
		setFirstItemIndex(room.msgs - messages.length);
		prepending.current = messages.length;
	}, [room._id]);

	const more = useMutableCallback(() => {
		prepending.current = messages.length;
		getMore();
	});

	useLayoutEffect(() => {
		setFirstItemIndex(() => room.msgs - messages.length);
	}, [messages.length]);

	return (
		messages.length > 0 && <Virtuoso
				ref={virtuoso}
			// overscan={50}
			firstItemIndex={firstItemIndex}
			// initialTopMostItemIndex={messages.length}
			// totalCount={Math.max(Math.max(messages.length + 50, Math.min(300, room.msgs)), room.msgs)}
			data={messages}
			// defaultItemHeight={20}
			components={{
				Scroller: ScrollableContentWrapper as any,
				Header: () => <RoomForeword rid={room._id} />,
			}}
			followOutput
			startReached={more}
			computeItemKey={(index) => messages[index]?._id || index}
			itemContent={(_, message) => {

				if(!message) {
					return <Box pi='x24' pb='x16' display='flex'>
					<Box>
						<Skeleton variant='rect' width={36} height={36} />
					</Box>
					<Box mis='x8' flexGrow={1}>
						<Skeleton width='100%' />
						<Skeleton width='40%' />
					</Box>
				</Box>
				}
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
			}}
		/>
	);
};
