import {
	Message as MessageTemplate,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageRole,
	MessageRoles,
	MessageTimestamp,
	MessageUsername,
} from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { IMessage } from '../../../../../definition/IMessage';
import Attachments from '../../../../components/Message/Attachments';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import Broadcast from '../../../../components/Message/Metrics/Broadcast';
import Discussion from '../../../../components/Message/Metrics/Discussion';
import Thread from '../../../../components/Message/Metrics/Thread';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useUserData } from '../../../../hooks/useUserData';
import { UserPresence } from '../../../../lib/presence';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';
import { useMessageActions } from '../../contexts/MessageContext';
import Toolbox from './Toolbox';

const Message: FC<{ message: IMessage; sequential: boolean }> = ({ message, sequential }) => {
	const {
		broadcast,
		actions: { openDiscussion, openThread, openUserCard, replyBroadcast },
		formatters,
	} = useMessageActions();

	const user: UserPresence = useUserData(message.u._id) || message.u;
	return (
		<MessageTemplate>
			<MessageLeftContainer>
				{!sequential && message.u.username && (
					<UserAvatar username={message.u.username} size={'x36'} />
				)}
			</MessageLeftContainer>
			<MessageContainer>
				{!sequential && (
					<MessageHeader>
						<MessageName data-username={user.username} onClick={openUserCard}>
							{user.name || user.username}
						</MessageName>
						{user.name && user.name !== user.username && (
							<MessageUsername data-username={user.username} onClick={openUserCard}>
								@{user.username}
							</MessageUsername>
						)}
						{Array.isArray(user.roles) && user.roles.length > 0 && (
							<MessageRoles>
								{user.roles.map((role) => (
									<MessageRole>{role}</MessageRole>
								))}
							</MessageRoles>
						)}
						<MessageTimestamp data-time={message.ts.toISOString()}>
							{formatters.messageHeader(message.ts)}
						</MessageTimestamp>
					</MessageHeader>
				)}
				<MessageBody>
					{!message.blocks && message.md && (
						<MessageBodyRender mentions={message.mentions} tokens={message.md} />
					)}
					{!message.blocks && !message.md && message.msg}
				</MessageBody>
				{message.blocks && (
					<MessageBlock mid={message._id} blocks={message.blocks} appId rid={message.rid} />
				)}
				{message.attachments && (
					<Attachments attachments={message.attachments} file={message.file} />
				)}
				{/* <Reactions>
				<Reactions.Reaction counter={1} />
				<Reactions.Reaction counter={2} />
				<Reactions.Reaction counter={3} />
				<Reactions.Action />
			  </Reactions> */}

				{message.tcount && <Thread openThread={openThread} counter={message.tcount} />}
				{/* //following={following} lm={message.tlm} rid={message.rid} mid={message._id} unread={unread} mention={mention all={all openThread={actions.openThread }} */}

				{message.drid && (
					<Discussion
						count={message.dcount}
						drid={message.drid}
						lm={message.dlm}
						openDiscussion={openDiscussion}
					/>
				)}
				{message.location && <MessageLocation location={message.location} />}
				{broadcast && user.username && (
					<Broadcast replyBroadcast={replyBroadcast} mid={message._id} username={user.username} />
				)}
			</MessageContainer>
			<Toolbox message={message} />
		</MessageTemplate>
	);
};

export default memo(Message);
