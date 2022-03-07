/* eslint-disable complexity */
import {
	Message as MessageTemplate,
	MessageBody,
	MessageContainer,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageTimestamp,
	MessageUsername,
	MessageStatusPrivateIndicator,
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
import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { isE2EEMessage } from '../../../../lib/isE2EEMessage';
import { UserPresence } from '../../../../lib/presence';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';
import { useMessageActions, useMessageRunActionLink } from '../../contexts/MessageContext';
import { useMessageListShowUsername, useMessageListShowRealName } from '../contexts/MessageListContext';
import { MessageIndicators } from './MessageIndicators';
import ReactionsList from './MessageReactionsList';
import ReadReceipt from './MessageReadReceipt';
import RolesList from './MessageRolesList';
import Toolbox from './Toolbox';
import PreviewList from './UrlPreview';

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

	const showRealName = useMessageListShowRealName();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;

	const isEncryptedMessage = isE2EEMessage(message);
	const encryptedMessageIsPending = isEncryptedMessage && message.e2e === 'pending';
	const messageIsReady = !isEncryptedMessage || !encryptedMessageIsPending;

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
							{getUserDisplayName(user.name, user.username, showRealName)}
						</MessageName>
						{showUsername && (
							<MessageUsername
								data-username={user.username}
								onClick={user.username !== undefined ? openUserCard(user.username) : undefined}
							>
								@{user.username}
							</MessageUsername>
						)}

						<RolesList user={user} isBot={message.bot} />

						<MessageTimestamp data-time={message.ts.toISOString()}>{formatters.messageHeader(message.ts)}</MessageTimestamp>
						{message.private && (
							// The MessageStatusPrivateIndicator component should not have name prop, it should be fixed on fuselage
							<MessageStatusPrivateIndicator name='message'>{t('Only_you_can_see_this_message')}</MessageStatusPrivateIndicator>
						)}
						<MessageIndicators message={message} />
					</MessageHeader>
				)}
				{/* <MessageBody>
					{message.e2e === 'pending'
						? t('E2E_message_encrypted_placeholder')
						: message.e2e !== 'done' &&
						  !message.blocks &&
						  message.md && <MessageBodyRender onMentionClick={openUserCard} mentions={message.mentions} tokens={message.md} />}
					{!message.blocks && !message.md && message.msg}
					{message.e2e === 'done' && message.msg}
				</MessageBody> */}

				<MessageBody>
					{encryptedMessageIsPending && t('E2E_message_encrypted_placeholder')}

					{messageIsReady && !message.blocks && message.md && (
						<MessageBodyRender onMentionClick={openUserCard} mentions={message.mentions} tokens={message.md} />
					)}

					{messageIsReady && !message.blocks && !message.md && message.msg}
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

				<ReactionsList message={message} />

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

				<PreviewList urls={message.urls} />

				<ReadReceipt />
			</MessageContainer>
			{!message.private && <Toolbox message={message} />}
		</MessageTemplate>
	);
};

export default memo(Message);
