import { Base64 } from '@rocket.chat/base64';
import type { IMessage } from '@rocket.chat/core-typings';
import {
	isDiscussionMessage,
	isThreadMainMessage,
	isE2EEMessage,
	isFileImageAttachment,
	isFileAttachment,
	isFileAudioAttachment,
	isFileVideoAttachment,
} from '@rocket.chat/core-typings';
import { MessageBody } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useUserData } from '../../../../hooks/useUserData';
import type { UserPresence } from '../../../../lib/presence';
import { useChat } from '../../../../views/room/contexts/ChatContext';
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
import { useOembedLayout } from '../../hooks/useOembedLayout';
import { useSubscriptionFromMessageQuery } from '../../hooks/useSubscriptionFromMessageQuery';
import UiKitMessageBlock from '../../uikit/UiKitMessageBlock';

type RoomMessageContentProps = {
	message: IMessage;
	unread: boolean;
	mention: boolean;
	all: boolean;
	searchText?: string;
};

const RoomMessageContent = ({ message, unread, all, mention, searchText }: RoomMessageContentProps): ReactElement => {
	const encrypted = isE2EEMessage(message);
	const { enabled: oembedEnabled } = useOembedLayout();
	const subscription = useSubscriptionFromMessageQuery(message).data ?? undefined;
	const broadcast = subscription?.broadcast ?? false;
	const uid = useUserId();
	const messageUser: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const readReceiptEnabled = useSetting('Message_Read_Receipt_Enabled', false);
	const chat = useChat();
	const t = useTranslation();

	const normalizedMessage = useNormalizedMessage(message);
	const isMessageEncrypted = encrypted && normalizedMessage?.e2e === 'pending';

	if (encrypted && normalizedMessage?.attachments?.length) {
		normalizedMessage.attachments.forEach((attachment) => {
			if (!attachment.encryption) {
				return;
			}

			const key = Base64.encode(JSON.stringify(attachment.encryption));

			if (isFileAttachment(attachment)) {
				if (attachment.title_link && !attachment.title_link.startsWith('/file-decrypt/')) {
					attachment.title_link = `/file-decrypt${attachment.title_link}?key=${key}`;
				}
				if (isFileImageAttachment(attachment) && !attachment.image_url.startsWith('/file-decrypt/')) {
					attachment.image_url = `/file-decrypt${attachment.image_url}?key=${key}`;
				}
				if (isFileAudioAttachment(attachment) && !attachment.audio_url.startsWith('/file-decrypt/')) {
					attachment.audio_url = `/file-decrypt${attachment.audio_url}?key=${key}`;
				}
				if (isFileVideoAttachment(attachment) && !attachment.video_url.startsWith('/file-decrypt/')) {
					attachment.video_url = `/file-decrypt${attachment.video_url}?key=${key}`;
				}
			}
		});
	}

	return (
		<>
			{!normalizedMessage.blocks?.length && !!normalizedMessage.md?.length && (
				<>
					{(!encrypted || normalizedMessage.e2e === 'done') && (
						<MessageContentBody
							id={`${message._id}-content`}
							md={normalizedMessage.md}
							mentions={normalizedMessage.mentions}
							channels={normalizedMessage.channels}
							searchText={searchText}
						/>
					)}
					{isMessageEncrypted && <MessageBody>{t('E2E_message_encrypted_placeholder')}</MessageBody>}
				</>
			)}

			{normalizedMessage.blocks && (
				<UiKitMessageBlock rid={normalizedMessage.rid} mid={normalizedMessage._id} blocks={normalizedMessage.blocks} />
			)}

			{!!normalizedMessage?.attachments?.length && (
				<Attachments id={message.files?.[0]?._id} attachments={normalizedMessage.attachments} isMessageEncrypted={isMessageEncrypted} />
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

			{chat && isThreadMainMessage(normalizedMessage) && (
				<ThreadMetrics
					counter={normalizedMessage.tcount}
					following={Boolean(uid && normalizedMessage?.replies?.indexOf(uid) > -1)}
					mid={normalizedMessage._id}
					rid={normalizedMessage.rid}
					lm={normalizedMessage.tlm}
					unread={unread}
					mention={mention}
					all={all}
					participants={normalizedMessage?.replies?.length}
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

			{broadcast && !!messageUser.username && normalizedMessage.u._id !== uid && (
				<BroadcastMetrics username={messageUser.username} message={normalizedMessage} />
			)}

			{readReceiptEnabled && <ReadReceiptIndicator unread={normalizedMessage.unread} />}
		</>
	);
};

export default memo(RoomMessageContent);
