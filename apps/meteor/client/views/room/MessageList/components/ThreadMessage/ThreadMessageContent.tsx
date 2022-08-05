/* eslint-disable complexity */
import { IMessage, ISubscription, isE2EEMessage } from '@rocket.chat/core-typings';
import { MessageBody, MessageBlock } from '@rocket.chat/fuselage';
import { useTranslation, TranslationKey } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import Attachments from '../../../../../components/message/Attachments';
import MessageActions from '../../../../../components/message/MessageActions';
import BroadcastMetric from '../../../../../components/message/Metrics/Broadcast';
import { useUserData } from '../../../../../hooks/useUserData';
import { UserPresence } from '../../../../../lib/presence';
import MessageBlockUiKit from '../../../../blocks/MessageBlock';
import MessageLocation from '../../../../location/MessageLocation';
import { useMessageActions, useMessageOembedIsEnabled, useMessageRunActionLink } from '../../../contexts/MessageContext';
import { useTranslateAttachments, useMessageListShowReadReceipt } from '../../contexts/MessageListContext';
import { isOwnUserMessage } from '../../lib/isOwnUserMessage';
import MessageContentBody from '../MessageContentBody';
import ReactionsList from '../MessageReactionsList';
import ReadReceipt from '../MessageReadReceipt';
import PreviewList from '../UrlPreview';

const ThreadMessageContent: FC<{ message: IMessage; sequential: boolean; subscription?: ISubscription; id: IMessage['_id'] }> = ({
	message,
	subscription,
}) => {
	const {
		broadcast,
		actions: { replyBroadcast },
	} = useMessageActions();

	const t = useTranslation();

	const runActionLink = useMessageRunActionLink();

	const oembedIsEnabled = useMessageOembedIsEnabled();
	const shouldShowReadReceipt = useMessageListShowReadReceipt();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };

	const shouldShowReactionList = message.reactions && Object.keys(message.reactions).length;

	const isEncryptedMessage = isE2EEMessage(message);

	const messageAttachments = useTranslateAttachments({ message });

	return (
		<>
			{!message.blocks && (message.md || message.msg) && (
				<MessageBody data-qa-type='message-body'>
					{!isEncryptedMessage && <MessageContentBody message={message} />}
					{isEncryptedMessage && message.e2e === 'done' && <MessageContentBody message={message} />}
					{isEncryptedMessage && message.e2e === 'pending' && t('E2E_message_encrypted_placeholder')}
				</MessageBody>
			)}
			{message.blocks && (
				<MessageBlock fixedWidth>
					<MessageBlockUiKit mid={message._id} blocks={message.blocks} appId rid={message.rid} />
				</MessageBlock>
			)}
			{messageAttachments && <Attachments attachments={messageAttachments} file={message.file} />}

			{oembedIsEnabled && !!message.urls?.length && <PreviewList urls={message.urls} />}

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

			{/* {isDiscussionMessage(message) && (
				<DiscussionMetric
					count={message.dcount}
					drid={message.drid}
					lm={message.dlm}
					rid={message.rid}
					openDiscussion={openRoom(message.drid)}
				/>
			)} */}

			{message.location && <MessageLocation location={message.location} />}

			{broadcast && !!user.username && !isOwnUserMessage(message, subscription) && (
				<BroadcastMetric replyBroadcast={(): void => replyBroadcast(message)} mid={message._id} username={user.username} />
			)}

			{shouldShowReadReceipt && <ReadReceipt unread={message.unread} />}
		</>
	);
};

export default memo(ThreadMessageContent);
