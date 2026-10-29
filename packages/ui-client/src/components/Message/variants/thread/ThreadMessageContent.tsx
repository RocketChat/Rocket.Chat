import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import MessageContentBody from '../../MessageContentBody';
import ReadReceiptIndicator from '../../ReadReceiptIndicator';
import Attachments from '../../content/Attachments';
import BroadcastMetrics from '../../content/BroadcastMetrics';
import Location from '../../content/Location';
import MessageActions from '../../content/MessageActions';
import Reactions from '../../content/Reactions';
import UrlPreviews from '../../content/UrlPreviews';
import { useMessageContent } from '../../contexts/MessageContentContext';
import { useMessageDisplay } from '../../contexts/MessageDisplayContext';
import { useMessageRenderers } from '../../contexts/MessageRenderersContext';
import { useCanReplyToBroadcast } from '../../hooks/useCanReplyToBroadcast';
import { useOembedLayout } from '../../hooks/useOembedLayout';
import { splitQuoteAttachments } from '../../lib/splitQuoteAttachments';
import { toMessageActionOptions } from '../../lib/toMessageActionOptions';

export type ThreadMessageContentProps = {
	message: IThreadMessage | IThreadMainMessage;
};

const ThreadMessageContent = ({ message }: ThreadMessageContentProps) => {
	const { t } = useTranslation();
	const encrypted = isE2EEMessage(message);
	const { enabled: oembedEnabled } = useOembedLayout();
	const { readReceipts } = useMessageDisplay();
	const { UiKitMessageBlock } = useMessageRenderers();
	const canReplyToBroadcast = useCanReplyToBroadcast(message);

	const normalizedMessage = useMessageContent().useNormalizedMessage(message);
	const isMessageEncrypted = encrypted && normalizedMessage.e2e === 'pending';

	const { quotes, attachments } = splitQuoteAttachments(normalizedMessage.attachments);

	const source = { rid: message.rid, mid: message._id, username: message.u.username, name: message.u.name };

	return (
		<>
			{isMessageEncrypted && (
				<MessageBody role='document' aria-roledescription={t('message_body')}>
					{t('E2E_message_encrypted_placeholder')}
				</MessageBody>
			)}

			{!!quotes.length && <Attachments attachments={quotes} source={source} />}

			{!normalizedMessage.blocks?.length && !!normalizedMessage.md.length && (!encrypted || normalizedMessage.e2e === 'done') && (
				<MessageContentBody
					id={`${normalizedMessage._id}-content`}
					md={normalizedMessage.md}
					msg={normalizedMessage.mdSource}
					mentions={normalizedMessage.mentions}
					channels={normalizedMessage.channels}
				/>
			)}

			{normalizedMessage.blocks && (
				<UiKitMessageBlock rid={normalizedMessage.rid} mid={normalizedMessage._id} blocks={normalizedMessage.blocks} />
			)}

			<Attachments id={message.files?.[0]?._id} attachments={attachments} source={source} />

			{oembedEnabled && !!normalizedMessage.urls?.length && <UrlPreviews urls={normalizedMessage.urls} />}

			{!!normalizedMessage.actionLinks?.length && (
				<MessageActions message={normalizedMessage} actions={toMessageActionOptions(normalizedMessage.actionLinks)} />
			)}

			{Object.keys(normalizedMessage.reactions ?? {}).length > 0 && <Reactions message={normalizedMessage} />}

			{normalizedMessage.location && <Location location={normalizedMessage.location} />}

			{canReplyToBroadcast && <BroadcastMetrics username={message.u.username ?? ''} message={normalizedMessage} />}

			{readReceipts.enabled && <ReadReceiptIndicator mid={normalizedMessage._id} unread={normalizedMessage.unread} />}
		</>
	);
};

export default memo(ThreadMessageContent);
