/* eslint-disable complexity */
import {
	Box,
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
	MessageStatusPrivateIndicator,
	MessageReactionAction,
} from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { IMessage, isDiscussionMessage, isThreadMainMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';
import Attachments from '../../../../components/Message/Attachments';
import MessageActions from '../../../../components/Message/MessageActions';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import Broadcast from '../../../../components/Message/Metrics/Broadcast';
import Discussion from '../../../../components/Message/Metrics/Discussion';
import Thread from '../../../../components/Message/Metrics/Thread';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { TranslationKey, useTranslation } from '../../../../contexts/TranslationContext';
import { useUserId } from '../../../../contexts/UserContext';
import { useUserData } from '../../../../hooks/useUserData';
import { UserPresence } from '../../../../lib/presence';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';
import {
	useMessageActions,
	useMessageOembedIsEnabled,
	useMessageOembedMaxWidth,
	useMessageRunActionLink,
} from '../../contexts/MessageContext';
import {
	useMessageListShowRoles,
	useMessageListShowUsername,
	useMessageListShowRealName,
	useOpenEmojiPicker,
	useReactionsFilter,
	useReactToMessage,
	useUserHasReacted,
} from '../contexts/MessageListContext';
import { convertOembedToUiKit } from '../lib/convertOembeddedToUikit';
import { MessageIndicators } from './MessageIndicators';
import { MessageReaction } from './MessageReaction';
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

	const runActionLink = useMessageRunActionLink();

	const hasReacted = useUserHasReacted(message);
	const reactToMessage = useReactToMessage(message);
	const filterReactions = useReactionsFilter(message);

	const oembedIsEnabled = useMessageOembedIsEnabled();
	const oembedWidth = useMessageOembedMaxWidth();

	const openEmojiPicker = useOpenEmojiPicker(message);

	const showRoles = useMessageListShowRoles();
	const showRealName = useMessageListShowRealName();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;

	const mineUid = useUserId();

	return (
		<MessageTemplate {...props}>
			<MessageLeftContainer>
				{!sequential && message.u.username && <UserAvatar username={message.u.username} size={'x36'} />}
				{sequential && <MessageIndicators message={message} />}
			</MessageLeftContainer>
			<MessageContainer>
				{!sequential && (
					<MessageHeader>
						<MessageName
							title={!showUsername && !usernameAndRealNameAreSame ? `@${user.username}` : undefined}
							data-username={user.username}
							onClick={user.username !== undefined ? openUserCard(user.username) : undefined}
						>
							{(showRealName && user.name) || user.username}
						</MessageName>
						{showUsername && (
							<MessageUsername
								data-username={user.username}
								onClick={user.username !== undefined ? openUserCard(user.username) : undefined}
							>
								@{user.username}
							</MessageUsername>
						)}
						<MessageRoles>
							{showRoles && Array.isArray(user.roles) && user.roles.length > 0 && (
								<>
									{user.roles.map((role, index) => (
										<MessageRole key={index}>{role}</MessageRole>
									))}
								</>
							)}
							{message.bot && <MessageRole>{t('Bot')}</MessageRole>}
						</MessageRoles>
						<MessageTimestamp data-time={message.ts.toISOString()}>{formatters.messageHeader(message.ts)}</MessageTimestamp>
						{message.private && <MessageStatusPrivateIndicator>{t('Only_you_can_see_this_message')}</MessageStatusPrivateIndicator>}
						<MessageIndicators message={message} />
					</MessageHeader>
				)}
				<MessageBody>
					{!message.blocks && message.md && (
						<MessageBodyRender onMentionClick={openUserCard} mentions={message.mentions} tokens={message.md} />
					)}
					{!message.blocks && !message.md && message.msg}
				</MessageBody>
				{message.blocks && <MessageBlock mid={message._id} blocks={message.blocks} appId rid={message.rid} />}
				{message.attachments && <Attachments attachments={message.attachments} file={message.file} />}

				{/* {{#unless hideActionLinks}}
				{{> MessageActions mid=msg._id actions=actionLinks runAction=(actions.runAction msg)}}
			{{/unless}} */}

				{message.actionLinks?.length && (
					<MessageActions
						mid={message._id}
						actions={message.actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
							methodId,
							i18nLabel: i18nLabel as TranslationKey,
							...action,
						}))}
						runAction={runActionLink(message)}
					/>
				)}
				{message.reactions && Object.keys(message.reactions).length > 0 && (
					<MessageReactions>
						{Object.entries(message.reactions).map(([name, reactions]) => (
							<MessageReaction
								key={name}
								counter={reactions.usernames.length}
								hasReacted={hasReacted}
								reactToMessage={reactToMessage}
								name={name}
								names={filterReactions(name)}
							/>
						))}
						<MessageReactionAction onClick={openEmojiPicker} />
					</MessageReactions>
				)}

				{isThreadMainMessage(message) && (
					<Thread
						openThread={openThread(message._id)}
						counter={message.tcount}
						following={Boolean(mineUid && message?.replies.indexOf(mineUid) > -1)}
						mid={message._id}
						rid={message.rid}
						lm={message.tlm}
						unread={Boolean(subscription?.tunread?.includes(message._id))}
						mention={Boolean(subscription?.tunreadUser?.includes(message._id))}
						all={Boolean(subscription?.tunreadGroup?.includes(message._id))}
						participants={message?.replies.length}
					/>
				)}

				{isDiscussionMessage(message) && (
					<Discussion
						count={message.dcount}
						drid={message.drid}
						lm={message.dlm}
						rid={message.rid}
						openDiscussion={openDiscussion(message.drid)}
					/>
				)}

				{message.location && <MessageLocation location={message.location} />}
				{broadcast && user.username && <Broadcast replyBroadcast={replyBroadcast} mid={message._id} username={user.username} />}

				{oembedIsEnabled && message.urls && (
					<Box width={oembedWidth}>
						<MessageBlock mid={message._id} blocks={convertOembedToUiKit(message.urls)} appId rid={message.rid} />
					</Box>
				)}
			</MessageContainer>
			{!message.private && <Toolbox message={message} />}
		</MessageTemplate>
	);
};

export default memo(Message);
