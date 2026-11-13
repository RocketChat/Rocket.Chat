import type { IMessage, IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import {
	Icon,
	Message,
	MessageBlock,
	MessageBody,
	MessageContainer,
	MessageContainerFixed,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageNameContainer,
	MessageTimestamp,
	Stack,
	Tag,
	Text,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { GenericMenu, useClipboardWithToast, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { MessageComposerFile } from '@rocket.chat/ui-composer';
import { useMediaUrl, useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useScheduledMessageText } from './useScheduledMessageText';
import { getFileExtension } from '../../../lib/utils/getFileExtension';
import { normalizeThreadMessage } from '../../lib/normalizeThreadMessage';
import { isPreviewableImage } from '../../lib/utils/isPreviewableImage';

const finalErrors = new Set([
	'room_is_archived',
	'room_is_blocked',
	'error-invalid-room',
	'error-invalid-user',
	'error-message-size-exceeded',
]);

type ScheduledMessageRowProps = {
	scheduledMessage: Pick<
		Serialized<IScheduledMessage>,
		'_id' | 'rid' | 'msg' | 't' | 'content' | 'files' | 'scheduledAt' | 'status' | 'error' | 'tmid'
	>;
	onSendNow: (scheduledMessageId: string) => void;
	onDelete: (scheduledMessageId: string) => void;
	onReschedule: (scheduledMessageId: string, scheduledAt: string) => void;
	onEdit: (scheduledMessageId: string, msg: string, tmid?: string, files?: IScheduledMessage['files']) => void;
	disabled?: boolean;
};

const ScheduledMessageRow = ({
	scheduledMessage: { _id, rid, msg: storedMsg, t: type, content, files, scheduledAt, status, error, tmid },
	onSendNow,
	onDelete,
	onReschedule,
	onEdit,
	disabled,
}: ScheduledMessageRowProps) => {
	const { t } = useTranslation();
	const getMediaUrl = useMediaUrl();
	const formatDateAndTime = useFormatDateAndTime();
	const author = useUser();
	const msg = useScheduledMessageText({ rid, msg: storedMsg, t: type, content }) ?? '';
	const { copy } = useClipboardWithToast(msg);
	const body = useMemo(() => normalizeThreadMessage({ msg } as IMessage, t), [msg, t]);

	const failed = status === 'failed';
	const canRetry = !failed || !error || !finalErrors.has(error);
	const interrupted = error === 'error-scheduled-message-interrupted';
	const sendLabel = failed ? t(interrupted ? 'Send_anyway' : 'Retry_now') : t('Send_now');

	return (
		<Message>
			<MessageLeftContainer>
				<MessageAvatar username={author?.username ?? ''} size='x36' />
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageNameContainer>
						<MessageName title={author?.username}>{author?.name || author?.username}</MessageName>
					</MessageNameContainer>
					<MessageTimestamp>
						<Icon name='clock-send' size='x12' /> {formatDateAndTime(new Date(scheduledAt))}
					</MessageTimestamp>
				</MessageHeader>
				{msg && <MessageBody clamp={2}>{body}</MessageBody>}
				{files?.length ? (
					<MessageBlock>
						<Stack direction='row' gap='x8' wrap aria-label={t('Uploads')} role='group'>
							{files.map(({ _id, name, type, description }) => {
								const url = getMediaUrl(`/file-upload/${_id}/${encodeURIComponent(name)}`);
								const extension = getFileExtension(name);
								return (
									<MessageComposerFile
										key={_id}
										fileTitle={name}
										fileSubtitle={extension}
										fileFormat={extension}
										showPreview={!!type && isPreviewableImage(type)}
										previewUrl={url}
										alt={description || name}
										actionIcon={null}
										onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
									/>
								);
							})}
						</Stack>
					</MessageBlock>
				) : null}
				{failed && (
					<MessageBlock>
						<Stack direction='row' gap='x8' align='center'>
							<Tag variant='danger'>{t('Failed')}</Tag>
							{error && (
								<Text is='span' fontScale='c1' color='danger'>
									{t(error)}
								</Text>
							)}
						</Stack>
					</MessageBlock>
				)}
			</MessageContainer>
			<MessageContainerFixed>
				<GenericMenu
					icon='kebab'
					detached
					disabled={disabled}
					title={t('Options')}
					items={[
						...(canRetry
							? [{ id: 'edit', icon: 'pencil' as const, content: t('Edit'), onClick: () => onEdit(_id, msg, tmid, files) }]
							: []),
						...(canRetry
							? [
									{ id: 'send-now', icon: 'send' as const, content: sendLabel, onClick: () => onSendNow(_id) },
									{ id: 'reschedule', icon: 'calendar' as const, content: t('Reschedule'), onClick: () => onReschedule(_id, scheduledAt) },
								]
							: []),
						...(canRetry ? [] : [{ id: 'copy', icon: 'copy' as const, content: t('Copy_text'), onClick: () => copy() }]),
						{ id: 'delete', icon: 'trash' as const, content: t('Delete'), variant: 'danger', onClick: () => onDelete(_id) },
					]}
				/>
			</MessageContainerFixed>
		</Message>
	);
};

export default ScheduledMessageRow;
