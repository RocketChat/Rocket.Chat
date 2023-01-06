import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { isDiscussionMessage, isThreadMainMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useUserData } from '../../../../hooks/useUserData';
import type { MessageWithMdEnforced } from '../../../../lib/parseMessageTextToAstMarkdown';
import type { UserPresence } from '../../../../lib/presence';
import { useRoomSubscription } from '../../../../views/room/contexts/RoomContext';
import MessageContentBody from '../../MessageContentBody';
import { useMessageContext } from '../../MessageContext';
import ReadReceiptIndicator from '../../ReadReceiptIndicator';
import Attachments from '../../content/Attachments';
import BroadcastMetrics from '../../content/BroadcastMetrics';
import DicussionMetrics from '../../content/DicussionMetrics';
import Location from '../../content/Location';
import MessageActions from '../../content/MessageActions';
import Reactions from '../../content/Reactions';
import ThreadMetrics from '../../content/ThreadMetrics';
import UiKitSurface from '../../content/UiKitSurface';
import UrlPreviews from '../../content/UrlPreviews';
import { useOembedLayout } from '../../hooks/useOembedLayout';
import { useTranslateAttachments, useMessageListShowReadReceipt } from '../../list/MessageListContext';

type RoomMessageContentProps = {
	message: MessageWithMdEnforced<IThreadMessage | IThreadMainMessage>;
	unread: boolean;
	mention: boolean;
	all: boolean;
};

const RoomMessageContent = ({ message, unread, all, mention }: RoomMessageContentProps): ReactElement => {
	const uid = useUserId();
	const {
		actions: { openRoom, openThread, replyBroadcast, runActionLink },
	} = useMessageContext();

	const { enabled: oembedEnabled } = useOembedLayout();
	const broadcast = useRoomSubscription()?.broadcast ?? false;

	const t = useTranslation();

	const shouldShowReadReceipt = useMessageListShowReadReceipt();
	const user: UserPresence = { ...message.u, roles: [], ...useUserData(message.u._id) };

	const shouldShowReactionList = message.reactions && Object.keys(message.reactions).length;

	const mineUid = useUserId();

	const isEncryptedMessage = isE2EEMessage(message);

	const messageAttachments = useTranslateAttachments({ message });

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

			{!!messageAttachments.length && <Attachments attachments={messageAttachments} file={message.file} />}

			{oembedEnabled && !!message.urls?.length && <UrlPreviews urls={message.urls} />}

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
					openThread={openThread(message._id)}
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

			{isDiscussionMessage(message) && (
				<DicussionMetrics
					count={message.dcount}
					drid={message.drid}
					lm={message.dlm}
					rid={message.rid}
					openDiscussion={openRoom(message.drid)}
				/>
			)}

			{message.location && <Location location={message.location} />}

			{broadcast && !!user.username && message.u._id !== uid && (
				<BroadcastMetrics replyBroadcast={(): void => replyBroadcast(message)} mid={message._id} username={user.username} />
			)}

			{shouldShowReadReceipt && <ReadReceiptIndicator unread={message.unread} />}
		</>
	);
};

export default memo(RoomMessageContent);
