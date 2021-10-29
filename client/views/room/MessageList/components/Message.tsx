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
	MessageReactions,
	MessageReaction,
	ReactionEmoji,
	ReactionCouter,
	MessagePrivateIndicator,
} from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { IMessage, isDiscussionMessage, isThreadMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';
import Attachments from '../../../../components/Message/Attachments';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import Broadcast from '../../../../components/Message/Metrics/Broadcast';
import Discussion from '../../../../components/Message/Metrics/Discussion';
import Thread from '../../../../components/Message/Metrics/Thread';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useUserId } from '../../../../contexts/UserContext';
import { useUserData } from '../../../../hooks/useUserData';
import { UserPresence } from '../../../../lib/presence';
import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';
import { useMessageActions } from '../../contexts/MessageContext';
import Toolbox from './Toolbox';

const Message: FC<{ message: IMessage; sequential: boolean; subscription?: ISubscription }> = ({
	message,
	sequential,
	subscription,
	...props
}) => {
	const t = useTranslation();
	const {
		broadcast,
		actions: { openDiscussion, openThread, openUserCard, replyBroadcast },
		formatters,
	} = useMessageActions();

	const meUid = useUserId();

	const user: UserPresence = useUserData(message.u._id) || { ...message.u, roles: [] };
	return (
		<MessageTemplate {...props}>
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
						{message.private && (
							<MessagePrivateIndicator>
								{t('Only_you_can_see_this_message')}
							</MessagePrivateIndicator>
						)}
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
				{message.reactions && Object.keys(message.reactions).length > 0 && (
					<MessageReactions>
						{Object.entries(message.reactions).map(([name, reactions]) => (
							<MessageReaction key={name}>
								<ReactionEmoji {...getEmojiClassNameAndDataTitle(name)} />
								<ReactionCouter counter={reactions.usernames.length} />
							</MessageReaction>
						))}
						<MessageReactions.Action />
					</MessageReactions>
				)}

				{isThreadMessage(message) && (
					<Thread
						openThread={openThread}
						counter={message.tcount}
						following={message?.replies.indexOf(meUid) > -1}
						mid={message._id}
						rid={message.rid}
						lm={message.tlm}
						unread={subscription?.tunread?.includes(message._id)}
						mention={subscription?.tunreadUser?.includes(message._id)}
						all={subscription?.tunreadGroup?.includes(message._id)}
						participants={message?.replies.length}
					/>
				)}

				{isDiscussionMessage(message) && (
					<Discussion
						count={message.dcount}
						drid={message.drid}
						lm={message.dlm}
						rid={message.rid}
						openDiscussion={openDiscussion}
					/>
				)}

				{message.location && <MessageLocation location={message.location} />}
				{broadcast && user.username && (
					<Broadcast replyBroadcast={replyBroadcast} mid={message._id} username={user.username} />
				)}
			</MessageContainer>
			{!message.private && <Toolbox message={message} />}
		</MessageTemplate>
	);
};

export default memo(Message);
