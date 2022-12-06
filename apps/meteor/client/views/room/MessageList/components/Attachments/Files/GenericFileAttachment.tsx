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

import MarkdownText from '../../../../../../components/MarkdownText';
import AttachmentSize from '../../../../../../components/message/Attachments/Attachment/AttachmentSize';
import MessageCollapsible from '../../MessageCollapsible';
import MessageContentBody from '../../MessageContentBody';

export const GenericFileAttachment: FC<MessageAttachmentBase> = ({
	title,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	size,
	format,
}) => {
	const getURL = useMediaUrl();

	const getFileExtension = (fileName?: string): string => {
		if (!fileName) {
			return 'file';
		}

		const arr = fileName.split('.');

		if (arr.length < 2 || (arr[0] === '' && arr.length === 2)) {
			return 'file';
		}

		return arr.pop()?.toLocaleUpperCase() || 'file';
	};

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={link}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<MessageGenericPreviewContent
						thumb={<MessageGenericPreviewIcon name='attachment-file' type={format || getFileExtension(title)} />}
					>
						<MessageGenericPreviewTitle externalUrl={hasDownload && link ? getURL(link) : undefined}>{title}</MessageGenericPreviewTitle>
						{size && (
							<MessageGenericPreviewDescription>{size && <AttachmentSize size={size} wrapper={false} />}</MessageGenericPreviewDescription>
						)}
					</MessageGenericPreviewContent>
				</MessageGenericPreview>
			</MessageCollapsible>
		</>
	);
};
