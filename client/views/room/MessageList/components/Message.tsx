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
import BroadcastMetric from '../../../../components/Message/Metrics/Broadcast';
import DiscussionMetric from '../../../../components/Message/Metrics/Discussion';
import ThreadMetric from '../../../../components/Message/Metrics/Thread';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { TranslationKey, useTranslation } from '../../../../contexts/TranslationContext';
import { useUserId } from '../../../../contexts/UserContext';
import { useUserData } from '../../../../hooks/useUserData';
import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { isE2EEMessage } from '../../../../lib/isE2EEMessage';
import { UserPresence } from '../../../../lib/presence';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';
import { useMessageActions, useMessageOembedIsEnabled, useMessageRunActionLink } from '../../contexts/MessageContext';
import { useIsEditingMessage } from '../contexts/MessageEditingContext';
import {
	useMessageListShowRoles,
	useMessageListShowUsername,
	useMessageListShowRealName,
	useMessageListShowReadReceipt,
} from '../contexts/MessageListContext';
import { MessageIndicators } from './MessageIndicators';
import ReactionsList from './MessageReactionsList';
import ReadReceipt from './MessageReadReceipt';
import RolesList from './MessageRolesList';
import Toolbox from './Toolbox';
import PreviewList from './UrlPreview';

const style = { backgroundColor: 'var(--message-box-editing-color)' };

const Message: FC<{ message: IMessage; sequential: boolean; subscription?: ISubscription; id: IMessage['_id'] }> = ({
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

	const oembedIsEnabled = useMessageOembedIsEnabled();

	const shouldShowReadReceipt = useMessageListShowReadReceipt();

	const showRealName = useMessageListShowRealName();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const usernameAndRealNameAreSame = !user.name || user.username === user.name;
	const showUsername = useMessageListShowUsername() && showRealName && !usernameAndRealNameAreSame;

	const isEditingMessage = useIsEditingMessage(message._id);

	const isEncryptedMessage = isE2EEMessage(message);
	const isEncryptedMessagePending = isEncryptedMessage && message.e2e === 'pending';
	const isMessageReady = !isEncryptedMessage || !isEncryptedMessagePending;

	const showRoles = useMessageListShowRoles();
	const shouldShowRolesList = !showRoles || !user.roles || !Array.isArray(user.roles) || user.roles.length < 1;

	const shouldShowReactionList = message.reactions && Object.keys(message.reactions).length;

	const mineUid = useUserId();

	return (
		<MessageTemplate {...props} style={isEditingMessage ? style : undefined}>
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

						{shouldShowRolesList && <RolesList user={user} isBot={message.bot} />}

						<MessageTimestamp data-time={message.ts.toISOString()}>{formatters.messageHeader(message.ts)}</MessageTimestamp>
						{message.private && (
							// The MessageStatusPrivateIndicator component should not have name prop, it should be fixed on fuselage
							<MessageStatusPrivateIndicator name='message'>{t('Only_you_can_see_this_message')}</MessageStatusPrivateIndicator>
						)}
						<MessageIndicators message={message} />
					</MessageHeader>
				)}

				<MessageBody>
					{isEncryptedMessagePending && t('E2E_message_encrypted_placeholder')}

					{isMessageReady && !message.blocks && message.md && (
						<MessageBodyRender onMentionClick={openUserCard} mentions={message.mentions} tokens={message.md} />
					)}

					{isMessageReady && !message.blocks && !message.md && message.msg}
				</MessageBody>
				{message.blocks && <MessageBlock mid={message._id} blocks={message.blocks} appId rid={message.rid} />}
				{message.attachments && <Attachments attachments={message.attachments} file={message.file} />}

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

				{shouldShowReactionList && <ReactionsList message={message} />}

				{isThreadMainMessage(message) && (
					<ThreadMetric
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
					<DiscussionMetric
						count={message.dcount}
						drid={message.drid}
						lm={message.dlm}
						rid={message.rid}
						openDiscussion={openDiscussion(message.drid)}
					/>
				)}

				{message.location && <MessageLocation location={message.location} />}
				{broadcast && user.username && <BroadcastMetric replyBroadcast={replyBroadcast} mid={message._id} username={user.username} />}

				{oembedIsEnabled && message.urls && <PreviewList urls={message.urls} />}

				{shouldShowReadReceipt && <ReadReceipt />}
			</MessageContainer>
			{!message.private && <Toolbox message={message} />}
		</MessageTemplate>
	);
};

export default memo(Message);
