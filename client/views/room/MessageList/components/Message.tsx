import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IMessage } from '../../../../../definition/IMessage';
import Attachments from '../../../../components/Message/Attachments';
import Discussion from '../../../../components/Message/Metrics/Discussion';
import Thread from '../../../../components/Message/Metrics/Thread';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';

const Message: FC<{ message: IMessage }> = ({ message }) => {
	const format = useFormatTime();

	return (
		<MessageTemplate>
			<MessageTemplate.LeftContainer>
				{message.u.username && <UserAvatar username={message.u.username} size={'x36'} />}
			</MessageTemplate.LeftContainer>
			<MessageTemplate.Container>
				<MessageTemplate.Header>
					<MessageTemplate.Name>{message.u.username}</MessageTemplate.Name>
					{/* <MessageTemplate.Username>@haylie.george</MessageTemplate.Username> */}
					{/* <MessageTemplate.Role>Admin</MessageTemplate.Role>
			<MessageTemplate.Role>User</MessageTemplate.Role>
			<MessageTemplate.Role>Owner</MessageTemplate.Role> */}
					<MessageTemplate.Timestamp>{format(message.ts)}</MessageTemplate.Timestamp>
				</MessageTemplate.Header>
				<MessageTemplate.Body>{!message.blocks && message.msg}</MessageTemplate.Body>
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
			</MessageTemplate.Container>
			{/* <MessageTemplate.Toolbox>
		  <MessageTemplate.Toolbox.Item icon='quote' />
		  <MessageTemplate.Toolbox.Item icon='clock' />
		  <MessageTemplate.Toolbox.Item icon='thread' />
		</MessageTemplate.Toolbox> */}
		</MessageTemplate>
	);
};

export default Message;
