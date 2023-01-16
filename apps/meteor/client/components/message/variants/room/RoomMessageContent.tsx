import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { isDiscussionMessage, isThreadMainMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useUserData } from '../../../../hooks/useUserData';
import type { UserPresence } from '../../../../lib/presence';
import { useMessageListShowReadReceipt } from '../../../../views/room/MessageList/contexts/MessageListContext';
import type { MessageWithMdEnforced } from '../../../../views/room/MessageList/lib/parseMessageTextToAstMarkdown';
import { useMessageActions, useMessageOembedIsEnabled, useMessageRunActionLink } from '../../../../views/room/contexts/MessageContext';
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

type RoomMessageContentProps = {
	message: MessageWithMdEnforced<IThreadMessage | IThreadMainMessage>;
	unread: boolean;
	mention: boolean;
	all: boolean;
};

const RoomMessageContent = ({ message, unread, all, mention }: RoomMessageContentProps): ReactElement => {
	const uid = useUserId();
	const { broadcast } = useMessageActions();

	const t = useTranslation();

	const runActionLink = useMessageRunActionLink();

	const oembedIsEnabled = useMessageOembedIsEnabled();
	const shouldShowReadReceipt = useMessageListShowReadReceipt();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };

	const shouldShowReactionList = message.reactions && Object.keys(message.reactions).length;

	const mineUid = useUserId();

	const isEncryptedMessage = isE2EEMessage(message);

	return (
		<>
			{!message.blocks?.length && !!message.md?.length && (
				<>
					{(!isEncryptedMessage || message.e2e === 'done') && (
						<MessageContentBody md={message.md} mentions={message.mentions} channels={message.channels} />
					)}
					{isEncryptedMessage && message.e2e === 'pending' && t('E2E_message_encrypted_placeholder')}
				</>
			)}

			{message.blocks && <UiKitSurface mid={message._id} blocks={message.blocks} appId rid={message.rid} />}

			{!!message?.attachments?.length && <Attachments attachments={message.attachments} file={message.file} />}

			{oembedIsEnabled && !!message.urls?.length && <UrlPreviews urls={message.urls} />}

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

			{shouldShowReactionList && <Reactions message={message} />}

			{isThreadMainMessage(message) && (
				<ThreadMetrics
					counter={message.tcount}
					following={Boolean(mineUid && message?.replies?.indexOf(mineUid) > -1)}
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

			{broadcast && !!user.username && message.u._id !== uid && (
				<BroadcastMetrics mid={message._id} username={user.username} message={message} />
			)}

			{shouldShowReadReceipt && <ReadReceiptIndicator unread={message.unread} />}
		</>
	);
};

export default memo(RoomMessageContent);
