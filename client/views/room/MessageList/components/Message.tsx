import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { IMessage } from '../../../../../definition/IMessage';
import Attachments from '../../../../components/Message/Attachments';
import Body from '../../../../components/Message/Body';
import Discussion from '../../../../components/Message/Metrics/Discussion';
import Thread from '../../../../components/Message/Metrics/Thread';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useFormatTime } from '../../../../hooks/useFormatTime';
import { useUserData } from '../../../../hooks/useUserData';
import { UserPresence } from '../../../../lib/presence';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';

const Message: FC<{ message: IMessage; sequential: boolean }> = ({ message, sequential }) => {
	const format = useFormatTime();
	const user: UserPresence = useUserData(message.u._id) || message.u;
	return (
		<MessageTemplate>
			<MessageTemplate.LeftContainer>
				{!sequential && message.u.username && (
					<UserAvatar username={message.u.username} size={'x36'} />
				)}
			</MessageTemplate.LeftContainer>
			<MessageTemplate.Container>
				{!sequential && (
					<MessageTemplate.Header>
						<MessageTemplate.Name>{user.name || user.username}</MessageTemplate.Name>
						{user.name && user.name !== user.username && (
							<MessageTemplate.Username>@haylie.george</MessageTemplate.Username>
						)}
						{Array.isArray(user.roles) && user.roles.length > 0 && (
							<MessageTemplate.Roles>
								{user.roles.map((role) => (
									<MessageTemplate.Role>{role}</MessageTemplate.Role>
								))}
							</MessageTemplate.Roles>
						)}
						<MessageTemplate.Timestamp>{format(message.ts)}</MessageTemplate.Timestamp>
					</MessageTemplate.Header>
				)}
				<MessageTemplate.Body>
					{!message.blocks && message.md && (
						<Body mentions={message.mentions} tokens={message.md} />
					)}
					{!message.blocks && !message.md && message.msg}
				</MessageTemplate.Body>
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
			<MessageTemplate.Toolbox>
				<MessageTemplate.Toolbox.Item icon='quote' />
				<MessageTemplate.Toolbox.Item icon='clock' />
				<MessageTemplate.Toolbox.Item icon='thread' />
			</MessageTemplate.Toolbox>
		</MessageTemplate>
	);
};

export default memo(Message);
