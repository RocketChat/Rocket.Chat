import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import {
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewIcon,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
} from '@rocket.chat/fuselage';
import { useMediaUrl, useSetModal } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import type { UIEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { getFileExtension } from '../../../../../../lib/utils/getFileExtension';
import { forAttachmentDownload, registerDownloadForUid } from '../../../../../hooks/useDownloadFromServiceWorker';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import AttachmentSize from '../structure/AttachmentSize';
import PdfPreviewModal from './PdfPreviewModal';

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
	const setModal = useSetModal();
	const uid = useId();
	const { t } = useTranslation();

	const handleTitleClick = (event: UIEvent): void => {
		if (!link) {
			return;
		}

		if (link.includes('/file-decrypt/')) {
			event.preventDefault();

			registerDownloadForUid(uid, t, title);
			forAttachmentDownload(uid, link);
			return;
		}

		if (format === 'PDF') {
			event.preventDefault();

			const previewUrl = new URL(getURL(link), window.location.origin);
			previewUrl.searchParams.set('contentDisposition', 'inline');

			const downloadUrl = hasDownload ? getExternalUrl() : undefined;

			const handleClose = () => setModal(null);
			const openInApp = openDocumentViewer
				? () => {
						openDocumentViewer(previewUrl.toString(), format, '');
						handleClose();
				  }
				: undefined;

			setModal(
				<PdfPreviewModal
					title={title}
					url={previewUrl.toString()}
					onClose={handleClose}
					downloadUrl={downloadUrl}
					onOpenInApp={openInApp}
				/>,
			);
			return;
		}

	};

	const getExternalUrl = () => {
		if (!hasDownload || !link) return undefined;

		if (openDocumentViewer) {
			const url = new URL(getURL(link), window.location.origin);
			url.searchParams.set('download', '');
			return url.toString();
		}

		const url = new URL(getURL(link), window.location.origin);
		url.searchParams.set('download', '');
		return url.toString();
	};

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={link} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<MessageGenericPreviewContent
						thumb={<MessageGenericPreviewIcon name='attachment-file' type={format || getFileExtension(title)} />}
					>
						<MessageGenericPreviewTitle
							download={!!openDocumentViewer}
							externalUrl={getExternalUrl()}
							onClick={handleTitleClick}
							data-qa-type='attachment-title-link'
						>
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
