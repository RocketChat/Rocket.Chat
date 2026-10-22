import type { IMessage, IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import {
	Box,
	Icon,
	Message,
	MessageBlock,
	MessageBody,
	MessageContainer,
	MessageContainerFixed,
	MessageHeader,
	MessageLeftContainer,
	MessageName,
	MessageTimestamp,
	Tag,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { GenericMenu, useClipboardWithToast, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { MessageComposerFile, MessageComposerFileGroup } from '@rocket.chat/ui-composer';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
	scheduledMessage: Pick<Serialized<IScheduledMessage>, '_id' | 'msg' | 'files' | 'scheduledAt' | 'status' | 'error' | 'u' | 'tmid'>;
	onSendNow: (scheduledMessageId: string) => void;
	onDelete: (scheduledMessageId: string) => void;
	onReschedule: (scheduledMessageId: string, scheduledAt: string) => void;
	onEdit: (scheduledMessageId: string, msg: string, tmid?: string, files?: IScheduledMessage['files']) => void;
	disabled?: boolean;
};

const ScheduledMessageRow = ({
	scheduledMessage: { _id, msg, files, scheduledAt, status, error, u, tmid },
	onSendNow,
	onDelete,
	onReschedule,
	onEdit,
	disabled,
}: ScheduledMessageRowProps) => {
	const { t } = useTranslation();
	const getMediaUrl = useMediaUrl();
	const formatDateAndTime = useFormatDateAndTime();
	const { copy } = useClipboardWithToast(msg);
	const body = useMemo(() => normalizeThreadMessage({ msg } as IMessage, t), [msg, t]);

	const failed = status === 'failed';
	const canRetry = !failed || !error || !finalErrors.has(error);
	const interrupted = error === 'error-scheduled-message-interrupted';
	const sendLabel = failed ? t(interrupted ? 'Send_anyway' : 'Retry_now') : t('Send_now');

	return (
		<Box is={Message} paddingBlockStart={16} paddingBlockEnd={8}>
			<MessageLeftContainer>
				<MessageAvatar username={u.username ?? ''} size='x36' />
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageName title={u.username}>{u.name || u.username}</MessageName>
					<MessageTimestamp>
						<Icon name='clock' size='x12' marginInlineStart={4} marginInlineEnd={2} />
						{formatDateAndTime(new Date(scheduledAt))}
					</MessageTimestamp>
				</MessageHeader>
				{msg && <MessageBody clamp={2}>{body}</MessageBody>}
				{files?.length ? (
					<MessageBlock>
						<MessageComposerFileGroup
							aria-label={t('Uploads')}
							paddingInline={0}
							paddingBlock={0}
							flexWrap='wrap'
							style={{ whiteSpace: 'normal', rowGap: 8 }}
						>
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
						</MessageComposerFileGroup>
					</MessageBlock>
				) : null}
				{failed && (
					<MessageBlock>
						<Box display='flex' alignItems='center' fontScale='c1' color='danger'>
							<Tag variant='danger'>{t('Failed')}</Tag>
							{error && (
								<Box is='span' marginInlineStart={8}>
									{t(error)}
								</Box>
							)}
						</Box>
					</MessageBlock>
				)}
			</MessageContainer>
			<Box is={MessageContainerFixed} marginBlockStart={-6}>
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
			</Box>
		</Box>
	);
};

export default ScheduledMessageRow;
