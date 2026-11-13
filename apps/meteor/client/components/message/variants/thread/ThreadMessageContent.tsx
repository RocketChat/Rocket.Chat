import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage, isQuoteAttachment } from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserId, useUserPresence } from '@rocket.chat/ui-contexts';
import {
	MessageActionLinks,
	MessageBroadcastMetrics,
	MessageContentBody,
	MessageLocation,
	MessageReactionList,
	MessageUrlPreviews,
	useMessageContent,
	useMessageDisplay,
	MessageAttachments,
} from '@rocket.chat/ui-message-list';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import UiKitMessageBlock from '../../../../providers/MessagesProvider/renderers/UiKitMessageBlock';
import ReadReceiptIndicator from '../../ReadReceiptIndicator';
import { useMessageBroadcast } from '../../hooks/useMessageBroadcast';
import { useOembedLayout } from '../../hooks/useOembedLayout';
import { useMessageListReadReceipts } from '../../list/MessageListContext';

export type ThreadMessageContentProps = {
	message: IThreadMessage | IThreadMainMessage;
};

const ThreadMessageContent = ({ message }: ThreadMessageContentProps) => {
	const encrypted = isE2EEMessage(message);
	const { enabled: oembedEnabled } = useOembedLayout();
	const broadcast = useMessageBroadcast(message);
	const uid = useUserId();
	const { enabled: readReceiptEnabled } = useMessageListReadReceipts();
	const { allowsInteraction } = useMessageDisplay();
	const messageUser = { ...message.u, roles: [], ...useUserPresence(message.u._id) };

	const { t } = useTranslation();

	const normalizedMessage = useMessageContent().useNormalizedMessage(message);

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
				<MessageAttachments
					attachments={quotes}
					source={{ rid: message.rid, mid: message._id, username: message.u.username, name: message.u.name }}
				/>
			)}

			{!normalizedMessage.blocks?.length && !!normalizedMessage.md?.length && (
				<>
					{(!encrypted || normalizedMessage.e2e === 'done') && (
						<MessageContentBody
							md={normalizedMessage.md}
							msg={normalizedMessage.mdSource}
							mentions={normalizedMessage.mentions}
							channels={normalizedMessage.channels}
						/>
					)}
				</>
			)}

			{normalizedMessage.blocks && (
				<UiKitMessageBlock rid={normalizedMessage.rid} mid={normalizedMessage._id} blocks={normalizedMessage.blocks} />
			)}

			{!!attachments && (
				<MessageAttachments
					id={message.files?.[0]?._id}
					attachments={attachments}
					source={{ rid: message.rid, mid: message._id, username: message.u.username, name: message.u.name }}
				/>
			)}

			{oembedEnabled && !!normalizedMessage.urls?.length && <MessageUrlPreviews urls={normalizedMessage.urls} />}

			{!!normalizedMessage.actionLinks?.length && (
				<MessageActionLinks
					message={normalizedMessage}
					actions={normalizedMessage.actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
						methodId,
						i18nLabel: i18nLabel as TranslationKey,
						...action,
					}))}
				/>
			)}

			{Object.keys(normalizedMessage.reactions ?? {}).length > 0 && <MessageReactionList message={normalizedMessage} />}

			{normalizedMessage.location && <MessageLocation location={normalizedMessage.location} />}

			{allowsInteraction && broadcast && !!messageUser.username && normalizedMessage.u._id !== uid && (
				<MessageBroadcastMetrics username={messageUser.username} message={normalizedMessage} />
			)}

			{readReceiptEnabled && <ReadReceiptIndicator mid={normalizedMessage._id} unread={normalizedMessage.unread} />}
		</>
	);
};

export default memo(ThreadMessageContent);
