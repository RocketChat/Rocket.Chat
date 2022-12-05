import { MessageAttachmentBase } from '@rocket.chat/core-typings';
import {
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewIcon,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
} from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MessageContentBody from '../../../../views/room/MessageList/components/MessageContentBody';
import MarkdownText from '../../../MarkdownText';
import AttachmentDownload from '../Attachment/AttachmentDownload';
import AttachmentRow from '../Attachment/AttachmentRow';
import AttachmentSize from '../Attachment/AttachmentSize';
import AttachmentTitle from '../Attachment/AttachmentTitle';
import { useCollapse } from '../hooks/useCollapse';

export const GenericFileAttachment: FC<MessageAttachmentBase> = ({
	title,
	collapsed: collapsedDefault = false,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	size,
	format,
}) => {
	const [collapsed, collapse] = useCollapse(collapsedDefault);
	const getURL = useMediaUrl();

	const fileFormat = (): string => format ?? title?.split('.').pop()?.toLocaleUpperCase() ?? 'file';

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<AttachmentRow>
				<AttachmentTitle>{title}</AttachmentTitle>
				{collapse}
				{hasDownload && link && <AttachmentDownload title={title} href={getURL(link)} />}
			</AttachmentRow>
			{!collapsed && (
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<MessageGenericPreviewContent thumb={<MessageGenericPreviewIcon name='attachment-file' type={fileFormat()} />}>
						<MessageGenericPreviewTitle externalUrl={hasDownload && link ? getURL(link) : undefined}>{title}</MessageGenericPreviewTitle>
						{size && (
							<MessageGenericPreviewDescription>{size && <AttachmentSize size={size} wrapper={false} />}</MessageGenericPreviewDescription>
						)}
					</MessageGenericPreviewContent>
				</MessageGenericPreview>
			)}
		</>
	);
};
