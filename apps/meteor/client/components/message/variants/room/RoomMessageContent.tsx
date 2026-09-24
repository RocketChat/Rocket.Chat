import type { IMessage } from '@rocket.chat/core-typings';
import { isDiscussionMessage, isThreadMainMessage, isE2EEMessage, isQuoteAttachment } from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import MessageContentBody from '../../MessageContentBody';
import ReadReceiptIndicator from '../../ReadReceiptIndicator';
import Attachments from '../../content/Attachments';
import BroadcastMetrics from '../../content/BroadcastMetrics';
import DiscussionMetrics from '../../content/DiscussionMetrics';
import Location from '../../content/Location';
import MessageActions from '../../content/MessageActions';
import Reactions from '../../content/Reactions';
import ThreadMetrics from '../../content/ThreadMetrics';
import UrlPreviews from '../../content/UrlPreviews';
import { useNormalizedMessage } from '../../hooks/useNormalizedMessage';
import {
	useMessageListOembedEnabled,
	useMessageListReadReceipts,
	useMessageListBroadcast,
	useMessageListChatAvailable,
} from '../../list/MessageListContext';
import { useMessageListViewer } from '../../list/MessageViewerContext';
import type { MessageAuthor } from '../../list/messageListContract';
import UiKitMessageBlock from '../../uikit/UiKitMessageBlock';

export type RoomMessageContentProps = {
	message: IMessage;
	author?: MessageAuthor;
	unread: boolean;
	mention: boolean;
	all: boolean;
	searchText?: string;
};

const RoomMessageContent = ({ message, author = message.u, unread, all, mention, searchText }: RoomMessageContentProps) => {
	const encrypted = isE2EEMessage(message);
	const oembedEnabled = useMessageListOembedEnabled();
	const broadcast = useMessageListBroadcast();
	const { uid } = useMessageListViewer();
	const { enabled: readReceiptEnabled } = useMessageListReadReceipts();
	const chatAvailable = useMessageListChatAvailable();
	const { t } = useTranslation();

	const normalizedMessage = useNormalizedMessage(message);
	const isMessageEncrypted = encrypted && normalizedMessage?.e2e === 'pending';

	const quotes = normalizedMessage?.attachments?.filter(isQuoteAttachment) || [];

	const attachments = normalizedMessage?.attachments?.filter((attachment) => !isQuoteAttachment(attachment)) || [];

	return (
		<>
			{isMessageEncrypted && (
				<MessageBody role='document' aria-roledescription={t('message_body')}>
					{t('E2E_message_encrypted_placeholder')}
				</MessageBody>
			)}

			{!!quotes?.length && (
				<Attachments
					attachments={quotes}
					source={{ rid: message.rid, mid: message._id, username: message.u.username, name: message.u.name }}
				/>
			)}

			{!normalizedMessage.blocks?.length && !!normalizedMessage.md?.length && (
				<>
					{(!encrypted || normalizedMessage.e2e === 'done') && (
						<MessageContentBody
							id={`${normalizedMessage._id}-content`}
							md={normalizedMessage.md}
							msg={normalizedMessage.mdSource}
							mentions={normalizedMessage.mentions}
							channels={normalizedMessage.channels}
							searchText={searchText}
						/>
					)}
				</>
			)}

			{!!attachments && (
				<Attachments
					id={message.files?.[0]?._id}
					attachments={attachments}
					source={{ rid: message.rid, mid: message._id, username: message.u.username, name: message.u.name }}
				/>
			)}

			{normalizedMessage.blocks && (
				<UiKitMessageBlock rid={normalizedMessage.rid} mid={normalizedMessage._id} blocks={normalizedMessage.blocks} />
			)}

			{oembedEnabled && !!normalizedMessage.urls?.length && <UrlPreviews urls={normalizedMessage.urls} />}

			{normalizedMessage.actionLinks?.length && (
				<MessageActions
					message={normalizedMessage}
					actions={normalizedMessage.actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
						methodId,
						i18nLabel: i18nLabel as TranslationKey,
						...action,
					}))}
				/>
			)}

			{normalizedMessage.reactions && Object.keys(normalizedMessage.reactions).length && <Reactions message={normalizedMessage} />}

			{chatAvailable && isThreadMainMessage(normalizedMessage) && (
				<ThreadMetrics
					counter={normalizedMessage.tcount}
					following={Boolean(uid && normalizedMessage?.replies?.indexOf(uid) > -1)}
					mid={normalizedMessage._id}
					rid={normalizedMessage.rid}
					lm={normalizedMessage.tlm}
					unread={unread}
					mention={mention}
					all={all}
					participants={normalizedMessage?.replies}
				/>
			)}

			{isDiscussionMessage(normalizedMessage) && (
				<DiscussionMetrics
					count={normalizedMessage.dcount}
					drid={normalizedMessage.drid}
					lm={normalizedMessage.dlm}
					rid={normalizedMessage.rid}
				/>
			)}

			{normalizedMessage.location && <Location location={normalizedMessage.location} />}

			{broadcast && !!author.username && normalizedMessage.u._id !== uid && (
				<BroadcastMetrics username={author.username} message={normalizedMessage} />
			)}

			{readReceiptEnabled && <ReadReceiptIndicator mid={normalizedMessage._id} unread={normalizedMessage.unread} />}
		</>
	);
};

export default memo(RoomMessageContent);
