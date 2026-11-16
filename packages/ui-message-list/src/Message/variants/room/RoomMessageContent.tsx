import type { IMessage } from '@rocket.chat/core-typings';
import { isDiscussionMessage, isThreadMainMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
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
import { useMessageContent } from '../../contexts/MessageContentContext';
import { useMessageDisplay } from '../../contexts/MessageDisplayContext';
import { useMessageRenderers } from '../../contexts/MessageRenderersContext';
import { useCanReplyToBroadcast } from '../../hooks/useCanReplyToBroadcast';
import { useOembedLayout } from '../../hooks/useOembedLayout';
import { splitQuoteAttachments } from '../../lib/splitQuoteAttachments';
import { toMessageActionOptions } from '../../lib/toMessageActionOptions';

export type RoomMessageContentProps = {
	message: IMessage;
	unread: boolean;
	mention: boolean;
	all: boolean;
	searchText?: string;
};

const RoomMessageContent = ({ message, unread, all, mention, searchText }: RoomMessageContentProps) => {
	const { t } = useTranslation();
	const encrypted = isE2EEMessage(message);
	const { enabled: oembedEnabled } = useOembedLayout();
	const uid = useUserId();
	const { readReceipts, allowsInteraction } = useMessageDisplay();
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
					searchText={searchText}
				/>
			)}

			<Attachments id={message.files?.[0]?._id} attachments={attachments} source={source} />

			{normalizedMessage.blocks && (
				<UiKitMessageBlock rid={normalizedMessage.rid} mid={normalizedMessage._id} blocks={normalizedMessage.blocks} />
			)}

			{oembedEnabled && !!normalizedMessage.urls?.length && <UrlPreviews urls={normalizedMessage.urls} />}

			{!!normalizedMessage.actionLinks?.length && (
				<MessageActions message={normalizedMessage} actions={toMessageActionOptions(normalizedMessage.actionLinks)} />
			)}

			{Object.keys(normalizedMessage.reactions ?? {}).length > 0 && <Reactions message={normalizedMessage} />}

			{allowsInteraction && isThreadMainMessage(normalizedMessage) && (
				<ThreadMetrics
					message={normalizedMessage}
					counter={normalizedMessage.tcount}
					following={Boolean(uid && normalizedMessage.replies?.includes(uid))}
					lm={normalizedMessage.tlm}
					unread={unread}
					mention={mention}
					all={all}
					participants={normalizedMessage.replies}
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

			{canReplyToBroadcast && <BroadcastMetrics username={message.u.username ?? ''} message={normalizedMessage} />}

			{readReceipts.enabled && <ReadReceiptIndicator mid={normalizedMessage._id} unread={normalizedMessage.unread} />}
		</>
	);
};

export default memo(RoomMessageContent);
