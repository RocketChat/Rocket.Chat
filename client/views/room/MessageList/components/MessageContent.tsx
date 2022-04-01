/* eslint-disable complexity */
import { MessageBody } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { IMessage, isDiscussionMessage, isThreadMainMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';
import { isE2EEMessage } from '../../../../../lib/isE2EEMessage';
import Attachments from '../../../../components/Message/Attachments';
import MessageActions from '../../../../components/Message/MessageActions';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import BroadcastMetric from '../../../../components/Message/Metrics/Broadcast';
import DiscussionMetric from '../../../../components/Message/Metrics/Discussion';
import ThreadMetric from '../../../../components/Message/Metrics/Thread';
import { TranslationKey } from '../../../../contexts/TranslationContext';
import { useUserId } from '../../../../contexts/UserContext';
import { useUserData } from '../../../../hooks/useUserData';
import { UserPresence } from '../../../../lib/presence';
import MessageBlock from '../../../blocks/MessageBlock';
import MessageLocation from '../../../location/MessageLocation';
import { useMessageActions, useMessageOembedIsEnabled, useMessageRunActionLink } from '../../contexts/MessageContext';
import { useMessageListShowReadReceipt } from '../contexts/MessageListContext';
import EncryptedMessageRender from './EncryptedMessageRender';
import ReactionsList from './MessageReactionsList';
import ReadReceipt from './MessageReadReceipt';
import PreviewList from './UrlPreview';

const MessageContent: FC<{ message: IMessage; sequential: boolean; subscription?: ISubscription; id: IMessage['_id'] }> = ({
	message,
	subscription,
}) => {
	const {
		broadcast,
		actions: { openDiscussion, openThread, openUserCard, replyBroadcast },
	} = useMessageActions();

	const runActionLink = useMessageRunActionLink();

	const oembedIsEnabled = useMessageOembedIsEnabled();
	const shouldShowReadReceipt = useMessageListShowReadReceipt();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const isEncryptedMessage = isE2EEMessage(message);

	const shouldShowReactionList = message.reactions && Object.keys(message.reactions).length;

	const mineUid = useUserId();

	return (
		<>
			<MessageBody data-type='message-body'>
				{!isEncryptedMessage && !message.blocks && message.md && (
					<MessageBodyRender onMentionClick={openUserCard} mentions={message.mentions} tokens={message.md} />
				)}

				{!isEncryptedMessage && !message.blocks && !message.md && message.msg}

				{isEncryptedMessage && <EncryptedMessageRender message={message} />}
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

			{broadcast && user.username && (
				<BroadcastMetric replyBroadcast={(): void => replyBroadcast(message)} mid={message._id} username={user.username} />
			)}

			{oembedIsEnabled && message.urls && <PreviewList urls={message.urls} />}

			{shouldShowReadReceipt && <ReadReceipt />}
		</>
	);
};

export default memo(MessageContent);
