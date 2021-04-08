import React, { FC } from 'react';
import { differenceInMinutes, isSameDay } from 'date-fns';
import { Message, Reactions, ThreadMessage } from '@rocket.chat/fuselage';

import { useRoom } from '../providers/RoomProvider';
import { useMessages } from './hooks/useMessages';
import { IRoom } from '../../../../definition/IRoom';
import { IMessage } from '../../../../definition/IMessage';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { useFormatTime } from '../../../hooks/useFormatTime';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import MessageBlock from '../../blocks/MessageBlock';
import MessageLocation from '../../location/MessageLocation';
import Attachments from '../../../components/Message/Attachments';
import Discussion from '../../../components/Message/Metrics/Discussion';
import Thread from '../../../components/Message/Metrics/Thread';
import { Virtuoso } from 'react-virtuoso';


const M: FC<{ message: IMessage }> = ({ message }) => {
	const format = useFormatTime();

	return <Message>
		<Message.LeftContainer>
		  { message.u.username && <UserAvatar username={message.u.username}
			size={'x36'}
		  /> }
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
		  <Message.Body>
			{!message.blocks && message.msg}
		  </Message.Body>
		  {message.blocks && <MessageBlock mid={message.mid} blocks={message.blocks} appId rid={message.rid} /> }
		  {message.attachments && <Attachments attachments={message.attachments} file={message.file} />}

		  { message.tcount && <Thread counter={message.tcount} /> }
		  {/* //following={following} lm={message.tlm} rid={message.rid} mid={message._id} unread={unread} mention={mention all={all openThread={actions.openThread }} */}

		  {message.drid && <Discussion count={message.dcount} drid={message.drid} lm={message.dlm} />}
		  {message.location && <MessageLocation location={message.location} /> }
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
}

const Sequential: FC<{ message: IMessage }> = ({ message }) => {
	return <Message>
		<Message.LeftContainer>
		</Message.LeftContainer>
		<Message.Container>
		  <Message.Body>
			{message.msg}
		  </Message.Body>
		  {message.blocks && <MessageBlock mid={message.mid} blocks={message.blocks} appId rid={message.rid} /> }
		  {message.attachments && <Attachments attachments={message.attachments} file={message.file} />}

		  {message.drid && <Discussion count={message.dcount} drid={message.drid} lm={message.dlm} />}
		  {message.location && <MessageLocation location={message.location} /> }
		</Message.Container>
	</Message>
}

const isSequential = (current: IMessage, previous?: IMessage): boolean => {
	if (!previous) {
		return false;
	}
	return differenceInMinutes(current.ts, previous.ts) < 5;
};

export const MessageList: FC = () => {
	const room = useRoom() as IRoom;
	const messages = useMessages({ rid: room._id });

	const format = useFormatDateAndTime();


	return <Virtuoso
	overscan={50}
	totalCount={messages.length}
	data={messages}
	components={{ Scroller: ScrollableContentWrapper }}
	followOutput={"smooth"}
	itemContent={(index, message) => {
		const previous = messages[index - 1];

		const sequential = isSequential(message, previous);

		const newDay = !previous || !isSameDay(message.ts, previous.ts);

		const Tab = sequential ? Sequential : M;
		return <>
			{newDay && <Message.Divider>{format(message.ts)}</Message.Divider>}
			<Tab message={message} key={message._id}/>
		</>}}
/>
};
