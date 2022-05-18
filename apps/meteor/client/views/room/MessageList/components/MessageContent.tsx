/* eslint-disable complexity */
import { IMessage, isDiscussionMessage, isThreadMainMessage, ISubscription } from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import { useUserId, TranslationKey } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import Attachments from '../../../../components/Message/Attachments';
import MessageActions from '../../../../components/Message/MessageActions';
import BroadcastMetric from '../../../../components/Message/Metrics/Broadcast';
import DiscussionMetric from '../../../../components/Message/Metrics/Discussion';
import ThreadMetric from '../../../../components/Message/Metrics/Thread';
import { useUserData } from '../../../../hooks/useUserData';
import { UserPresence } from '../../../../lib/presence';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';
import { useMessageActions, useMessageOembedIsEnabled, useMessageRunActionLink } from '../../contexts/MessageContext';
import { useMessageListShowReadReceipt } from '../contexts/MessageListContext';
import { isOwnUserMessage } from '../lib/isOwnUserMessage';
import ReactionsList from './MessageReactionsList';
import ReadReceipt from './MessageReadReceipt';
import MessageRender from './MessageRender';
import PreviewList from './UrlPreview';

const MessageContent: FC<{ message: IMessage; sequential: boolean; subscription?: ISubscription; id: IMessage['_id'] }> = ({
	message,
	subscription,
}) => {
	const {
		broadcast,
		actions: { openRoom, openThread, replyBroadcast },
	} = useMessageActions();

	const runActionLink = useMessageRunActionLink();

	const oembedIsEnabled = useMessageOembedIsEnabled();
	const shouldShowReadReceipt = useMessageListShowReadReceipt();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };

	const shouldShowReactionList = message.reactions && Object.keys(message.reactions).length;

	const mineUid = useUserId();

	return (
		<>
			<MessageBody data-qa-type='message-body'>
				<MessageRender message={message} />
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
					openDiscussion={openRoom(message.drid)}
				/>
			)}

			{message.location && <MessageLocation location={message.location} />}

			{broadcast && !!user.username && !isOwnUserMessage(message, subscription) && (
				<BroadcastMetric replyBroadcast={(): void => replyBroadcast(message)} mid={message._id} username={user.username} />
			)}

			{oembedIsEnabled && message.urls && <PreviewList urls={message.urls} />}

			{shouldShowReadReceipt && <ReadReceipt unread={message.unread} />}
		</>
	);
};

export default memo(MessageContent);
