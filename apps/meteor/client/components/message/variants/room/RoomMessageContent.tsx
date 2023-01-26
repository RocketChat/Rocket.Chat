import type { IMessage } from '@rocket.chat/core-typings';
import { isDiscussionMessage, isThreadMainMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useUserData } from '../../../../hooks/useUserData';
import type { MessageWithMdEnforced } from '../../../../lib/parseMessageTextToAstMarkdown';
import type { UserPresence } from '../../../../lib/presence';
import { useRoomSubscription } from '../../../../views/room/contexts/RoomContext';
import MessageContentBody from '../../MessageContentBody';
import ReadReceiptIndicator from '../../ReadReceiptIndicator';
import Attachments from '../../content/Attachments';
import BroadcastMetrics from '../../content/BroadcastMetrics';
import DiscussionMetrics from '../../content/DiscussionMetrics';
import Location from '../../content/Location';
import MessageActions from '../../content/MessageActions';
import Reactions from '../../content/Reactions';
import ThreadMetrics from '../../content/ThreadMetrics';
import UiKitSurface from '../../content/UiKitSurface';
import UrlPreviews from '../../content/UrlPreviews';
import { useOembedLayout } from '../../hooks/useOembedLayout';

type RoomMessageContentProps = {
	message: MessageWithMdEnforced<IMessage>;
	unread: boolean;
	mention: boolean;
	all: boolean;
};

const RoomMessageContent = ({ message, unread, all, mention }: RoomMessageContentProps): ReactElement => {
	const encrypted = isE2EEMessage(message);
	const { enabled: oembedEnabled } = useOembedLayout();
	const broadcast = useRoomSubscription()?.broadcast ?? false;
	const uid = useUserId();
	const messageUser: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };
	const readReceiptEnabled = useSetting('Message_Read_Receipt_Enabled', false);

	const t = useTranslation();

	return (
		<>
			{!message.blocks?.length && !!message.md?.length && (
				<>
					{(!encrypted || message.e2e === 'done') && (
						<MessageContentBody md={message.md} mentions={message.mentions} channels={message.channels} />
					)}
					{encrypted && message.e2e === 'pending' && t('E2E_message_encrypted_placeholder')}
				</>
			)}

			{message.blocks && <UiKitSurface mid={message._id} blocks={message.blocks} appId rid={message.rid} />}

			{!!message?.attachments?.length && <Attachments attachments={message.attachments} file={message.file} />}

			{oembedEnabled && !!message.urls?.length && <UrlPreviews urls={message.urls} />}

			{message.actionLinks?.length && (
				<MessageActions
					message={message}
					actions={message.actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
						methodId,
						i18nLabel: i18nLabel as TranslationKey,
						...action,
					}))}
				/>
			)}

			{message.reactions && Object.keys(message.reactions).length && <Reactions message={message} />}

			{isThreadMainMessage(message) && (
				<ThreadMetrics
					counter={message.tcount}
					following={Boolean(uid && message?.replies?.indexOf(uid) > -1)}
					mid={message._id}
					rid={message.rid}
					lm={message.tlm}
					unread={unread}
					mention={mention}
					all={all}
					participants={message?.replies?.length}
				/>
			)}

			{isDiscussionMessage(message) && <DiscussionMetrics count={message.dcount} drid={message.drid} lm={message.dlm} rid={message.rid} />}

			{message.location && <Location location={message.location} />}

			{broadcast && !!messageUser.username && message.u._id !== uid && (
				<BroadcastMetrics username={messageUser.username} message={message} />
			)}

			{readReceiptEnabled && <ReadReceiptIndicator unread={message.unread} />}
		</>
	);
};

export default memo(RoomMessageContent);
