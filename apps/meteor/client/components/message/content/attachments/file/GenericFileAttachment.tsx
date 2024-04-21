import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import {
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewIcon,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
} from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import type { UIEvent } from 'react';
import React from 'react';

import { getFileExtension } from '../../../../../../lib/utils/getFileExtension';
import MessageCollapsible from '../../../MessageCollapsible';
import AttachmentDescription from '../structure/AttachmentDescription';
import AttachmentSize from '../structure/AttachmentSize';

const openDocumentViewer = window.RocketChatDesktop?.openDocumentViewer;

type GenericFileAttachmentProps = MessageAttachmentBase;

const GenericFileAttachment = ({
	title,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	size,
	format,
	collapsed,
}: GenericFileAttachmentProps) => {
	const getURL = useMediaUrl();

	const handleTitleClick = (event: UIEvent): void => {
		if (openDocumentViewer && link && format === 'PDF') {
			event.preventDefault();
			openDocumentViewer(getURL(link), format, '');
		}
	};

	const getExternalUrl = () => {
		if (!hasDownload || !link) return undefined;

		if (openDocumentViewer) return `${getURL(link)}?download`;

		return getURL(link);
	};

	return (
		<>
			<AttachmentDescription description={description} descriptionMd={descriptionMd} />
			<MessageCollapsible title={title} hasDownload={hasDownload} link={link} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<MessageGenericPreviewContent
						thumb={<MessageGenericPreviewIcon name='attachment-file' type={format || getFileExtension(title)} />}
					>
						<MessageGenericPreviewTitle externalUrl={getExternalUrl()} onClick={handleTitleClick} data-qa-type='attachment-title-link'>
							{title}
						</MessageGenericPreviewTitle>
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

export default GenericFileAttachment;
