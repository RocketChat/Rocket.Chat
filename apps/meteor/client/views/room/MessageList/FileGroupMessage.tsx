import type { IMessage, ImageAttachmentProps, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { isFileAttachment, isFileImageAttachment, isQuoteAttachment } from '@rocket.chat/core-typings';
import { Box, Bubble, Message, MessageContainer, MessageDivider, MessageLeftContainer } from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useMediaUrl, useUserId, useUserCard } from '@rocket.chat/ui-contexts';
import { zipSync } from 'fflate';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import FileGroupImageGrid from './FileGroupImageGrid';
import { useIsMessageHighlight } from './contexts/MessageHighlightContext';
import { useCountSelected, useIsSelectedMessage, useIsSelecting, useToggleSelect } from './contexts/SelectedMessagesContext';
import { useJumpToMessage } from './hooks/useJumpToMessage';
import { registerFileGroup, unregisterFileGroup } from './lib/fileGroupStore';
import { isMessageNewDay } from './lib/isMessageNewDay';
import Emoji from '../../../components/Emoji';
import MessageContentBody from '../../../components/message/MessageContentBody';
import MessageHeader from '../../../components/message/MessageHeader';
import MessageToolbarHolder from '../../../components/message/MessageToolbarHolder';
import ReadReceiptIndicator from '../../../components/message/ReadReceiptIndicator';
import StatusIndicators from '../../../components/message/StatusIndicators';
import Action from '../../../components/message/content/Action';
import Attachments from '../../../components/message/content/Attachments';
import Reactions from '../../../components/message/content/Reactions';
import { useCollapse } from '../../../components/message/hooks/useCollapse';
import { useNormalizedMessage } from '../../../components/message/hooks/useNormalizedMessage';
import { useMessageListFormatDate, useMessageListReadReceipts } from '../../../components/message/list/MessageListContext';
import { useDateRef } from '../providers/DateListProvider';

type FileGroupMessageProps = {
	messages: IMessage[];
	previous?: IMessage;
	showUnreadDivider: boolean;
	sequential: boolean;
	showUserAvatar: boolean;
};

const isImageAttachment = (attachment: MessageAttachmentBase): attachment is ImageAttachmentProps & { type: 'file' } =>
	isFileAttachment(attachment) && isFileImageAttachment(attachment);

const getFileAttachments = (message: IMessage) =>
	(message.attachments?.filter((a) => !isQuoteAttachment(a)) ?? []).map((attachment) => ({
		attachment,
		fileId: isFileAttachment(attachment) ? attachment.fileId : undefined,
	}));

const IMAGE_GROUP_MAX_WIDTH = 480;

export const FileGroupMessage = memo(({ messages, previous, showUnreadDivider, sequential, showUserAvatar }: FileGroupMessageProps) => {
	const { t } = useTranslation();
	const formatDate = useMessageListFormatDate();
	const uid = useUserId();
	const { openUserCard, triggerProps } = useUserCard();
	const ref = useDateRef();
	const getURL = useMediaUrl();

	const firstMessage = messages[0];
	const groupedMessages = useMemo(() => messages.slice(1), [messages]);

	useEffect(() => {
		if (groupedMessages.length > 0) {
			registerFileGroup(firstMessage._id, groupedMessages);
		}
		return () => unregisterFileGroup(firstMessage._id);
	}, [firstMessage._id, groupedMessages]);

	const newDay = isMessageNewDay(firstMessage, previous);
	const showDivider = newDay || showUnreadDivider;
	const shouldShowAsSequential = sequential && !newDay;

	const editing = useIsMessageHighlight(firstMessage._id);
	const selecting = useIsSelecting();
	const toggleSelected = useToggleSelect(firstMessage._id);
	const selected = useIsSelectedMessage(firstMessage._id);
	const { enabled: readReceiptEnabled } = useMessageListReadReceipts();
	useCountSelected();
	const messageRef = useJumpToMessage(firstMessage._id);
	const normalizedFirstMessage = useNormalizedMessage(firstMessage);

	const allAttachments = useMemo(() => messages.flatMap(getFileAttachments), [messages]);

	const allImages = allAttachments.every(({ attachment }) => isImageAttachment(attachment));
	const showImageGrid = allImages && allAttachments.length > 1;
	const [collapsed, collapseAction] = useCollapse();

	const handleDownloadAll = useCallback(async () => {
		const files: Record<string, Uint8Array> = {};

		await Promise.all(
			allAttachments.map(async ({ attachment }) => {
				const imgAttachment = attachment as ImageAttachmentProps;
				const link = imgAttachment.title_link || imgAttachment.image_url;
				const url = `${getURL(link)}?download`;
				const fileName = imgAttachment.title || `file-${Object.keys(files).length}`;

				const response = await fetch(url);
				const buffer = await response.arrayBuffer();
				files[fileName] = new Uint8Array(buffer);
			}),
		);

		const zipped = zipSync(files);
		const blob = new Blob([zipped], { type: 'application/zip' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'files.zip';
		a.click();
		URL.revokeObjectURL(url);
	}, [allAttachments, getURL]);

	return (
		<>
			{showDivider && (
				<Box
					ref={ref}
					data-id={firstMessage.ts}
					role='listitem'
					{...(newDay && {
						'data-time': new Date(firstMessage.ts)
							.toISOString()
							.replaceAll(/[-T:.]/g, '')
							.substring(0, 8),
					})}
				>
					<MessageDivider unreadLabel={showUnreadDivider ? t('Unread_Messages').toLowerCase() : undefined}>
						{newDay && (
							<Bubble small secondary>
								{formatDate(firstMessage.ts)}
							</Bubble>
						)}
					</MessageDivider>
				</Box>
			)}

			<Message
				ref={messageRef}
				id={firstMessage._id}
				role='listitem'
				aria-roledescription={t('message')}
				tabIndex={0}
				onClick={selecting ? toggleSelected : undefined}
				isSelected={selected}
				isEditing={editing}
				isPending={firstMessage.temp}
				sequential={shouldShowAsSequential}
				data-id={firstMessage._id}
				data-mid={firstMessage._id}
				data-own={firstMessage.u._id === uid}
				aria-busy={firstMessage.temp}
			>
				<MessageLeftContainer>
					{!shouldShowAsSequential && firstMessage.u.username && !selecting && showUserAvatar && (
						<MessageAvatar
							emoji={firstMessage.emoji ? <Emoji emojiHandle={firstMessage.emoji} fillContainer /> : undefined}
							avatarUrl={firstMessage.avatar}
							username={firstMessage.u.username}
							size='x36'
							onClick={(e) => openUserCard(e, firstMessage.u.username)}
							style={{ cursor: 'pointer' }}
							role='button'
							{...triggerProps}
						/>
					)}
					{shouldShowAsSequential && <StatusIndicators message={firstMessage} />}
				</MessageLeftContainer>
				<MessageContainer>
					{!shouldShowAsSequential && <MessageHeader message={firstMessage} />}

					{!normalizedFirstMessage.blocks?.length && !!normalizedFirstMessage.md?.length && (
						<MessageContentBody
							id={`${normalizedFirstMessage._id}-content`}
							md={normalizedFirstMessage.md}
							mentions={normalizedFirstMessage.mentions}
							channels={normalizedFirstMessage.channels}
						/>
					)}

					{showImageGrid ? (
						<>
							<Box display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
								<Box withTruncatedText>{t('__count__files', { count: allAttachments.length })}</Box>
								{collapseAction}
								<Action icon='cloud-arrow-down' title={t('Download')} onClick={handleDownloadAll} />
							</Box>
							{!collapsed && <FileGroupImageGrid attachments={allAttachments} maxWidth={IMAGE_GROUP_MAX_WIDTH} />}
						</>
					) : (
						<Attachments id={firstMessage.files?.[0]?._id} attachments={allAttachments.map(({ attachment }) => attachment)} />
					)}

					{firstMessage.reactions && Object.keys(firstMessage.reactions).length > 0 && <Reactions message={firstMessage} />}
					{readReceiptEnabled && <ReadReceiptIndicator mid={firstMessage._id} unread={firstMessage.unread} />}
				</MessageContainer>
				{!firstMessage.private && firstMessage?.e2e !== 'pending' && !selecting && <MessageToolbarHolder message={firstMessage} />}
			</Message>
		</>
	);
});

FileGroupMessage.displayName = 'FileGroupMessage';
