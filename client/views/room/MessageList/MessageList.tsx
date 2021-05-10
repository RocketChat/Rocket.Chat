import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import { isSameDay } from 'date-fns';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { IMessage } from '../../../../definition/IMessage';
import { IRoom, IRoom } from '../../../../definition/IRoom';
import Attachments from '../../../components/Message/Attachments';
import Discussion from '../../../components/Message/Metrics/Discussion';
import Thread from '../../../components/Message/Metrics/Thread';
import RoomForeword from '../../../components/RoomForeword';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { useFormatDateAndTime, useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useFormatTime } from '../../../hooks/useFormatTime';
import MessageBlock from '../../blocks/MessageBlock';
import { useRoom, useRoomContext } from '../providers/RoomProvider';
import { Message } from './components/Message';
import { SequentialMessage } from './components/SequentialMessage';
import { useMessages } from './hooks/useMessages';


import MessageLocation from '../../location/MessageLocation';

const M: FC<{ message: IMessage }> = ({ message }) => {
	const format = useFormatTime();

	return (
		<Message>
			<Message.LeftContainer>
				{message.u.username && <UserAvatar username={message.u.username} size={'x36'} />}
			</Message.LeftContainer>
			<Message.Container>
				<Message.Header>
					<Message.Name>{message.u.username}</Message.Name>
					{/* <Message.Username>@haylie.george</Message.Username> */}
					{/* <Message.Role>Admin</Message.Role>
			<Message.Role>User</Message.Role>
			<Message.Role>Owner</Message.Role> */}
					<Message.Timestamp>{format(message.ts)}</Message.Timestamp>
				</Message.Header>
				<Message.Body>{!message.blocks && message.msg}</Message.Body>
				{message.blocks && (
					<MessageBlock mid={message.mid} blocks={message.blocks} appId rid={message.rid} />
				)}
				{message.attachments && (
					<Attachments attachments={message.attachments} file={message.file} />
				)}

				{message.tcount && <Thread counter={message.tcount} />}
				{/* //following={following} lm={message.tlm} rid={message.rid} mid={message._id} unread={unread} mention={mention all={all openThread={actions.openThread }} */}

				{message.drid && <Discussion count={message.dcount} drid={message.drid} lm={message.dlm} />}
				{message.location && <MessageLocation location={message.location} />}
				{/* <Reactions>
			<Reactions.Reaction counter={1} />
			<Reactions.Reaction counter={2} />
			<Reactions.Reaction counter={3} />
			<Reactions.Action />
		  </Reactions> */}
			</Message.Container>
			{/* <Message.Toolbox>
		  <Message.Toolbox.Item icon='quote' />
		  <Message.Toolbox.Item icon='clock' />
		  <Message.Toolbox.Item icon='thread' />
		</Message.Toolbox> */}
		</Message>
	);
};

const Sequential: FC<{ message: IMessage }> = ({ message }) => (
	<Message>
		<Message.LeftContainer></Message.LeftContainer>
		<Message.Container>
			<Message.Body>{message.msg}</Message.Body>
			{message.blocks && (
				<MessageBlock mid={message.mid} blocks={message.blocks} appId rid={message.rid} />
			)}
			{message.attachments && <Attachments attachments={message.attachments} file={message.file} />}

			{message.drid && <Discussion count={message.dcount} drid={message.drid} lm={message.dlm} />}
			{message.location && <MessageLocation location={message.location} />}
		</Message.Container>
	</Message>
);

const isSequential = (current: IMessage, previous?: IMessage): boolean => {
	if (!previous) {
		return false;
	}
	return differenceInMinutes(current.ts, previous.ts) < 5;
};

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

	useEffect(() => {
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

			const Template = sequential ? SequentialMessage : Message;
			return (
				<>
					{newDay && <MessageTemplate.Divider>{format(message.ts)}</MessageTemplate.Divider>}
					<Template message={message} key={message._id} />
				</>
			);
		},
		[messages],
	);
	return (
		<Virtuoso
			overscan={50}
			firstItemIndex={firstItemIndex}
			totalCount={messages.length}
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
