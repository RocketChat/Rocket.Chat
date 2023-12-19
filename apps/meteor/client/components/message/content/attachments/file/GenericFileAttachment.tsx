import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import {
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewIcon,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
	Button,
} from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { getFileExtension } from '../../../../../../lib/utils/getFileExtension';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import AttachmentSize from '../structure/AttachmentSize';

const desktopApp = window.RocketChatDesktop;
const openDocumentViewer = desktopApp?.openDocumentViewer;

export const GenericFileAttachment: FC<MessageAttachmentBase> = ({
	title,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	size,
	format,
	collapsed,
}) => {
	const getURL = useMediaUrl();

	const handleOpenDocumentViewer = (event: { preventDefault: () => void }): void => {
		event.preventDefault();

		if (openDocumentViewer && link && format) {
			openDocumentViewer(getURL(link), format, '');
		}
	};

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={link} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<MessageGenericPreviewContent
						thumb={<MessageGenericPreviewIcon name='attachment-file' type={format || getFileExtension(title)} />}
					>
						{!desktopApp && (
							<MessageGenericPreviewTitle externalUrl={hasDownload && link ? getURL(link) : undefined} data-qa-type='attachment-title-link'>
								{title}
							</MessageGenericPreviewTitle>
						)}
						{desktopApp && link && format === 'PDF' && (
							<Button onClick={handleOpenDocumentViewer} data-qa-type='attachment-title-link'>
								{title}
							</Button>
						)}
						{desktopApp && format !== 'PDF' && (
							<MessageGenericPreviewTitle
								externalUrl={hasDownload && link ? `${getURL(link)}?download` : undefined}
								data-qa-type='attachment-title-link'
							>
								{title}
							</MessageGenericPreviewTitle>
						)}
						{size && (
							<MessageGenericPreviewDescription>
								<AttachmentSize size={size} wrapper={false} />
							</MessageGenericPreviewDescription>
						)}
					</MessageGenericPreviewContent>
				</MessageGenericPreview>
			</MessageCollapsible>
		</>
	);
};
