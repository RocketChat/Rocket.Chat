import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import {
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewIcon,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
} from '@rocket.chat/fuselage';
import { useMediaUrl, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import type { UIEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { getFileExtension } from '../../../../../../lib/utils/getFileExtension';
import { forAttachmentDownload, registerDownloadForUid } from '../../../../../hooks/useDownloadFromServiceWorker';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import AttachmentSize from '../structure/AttachmentSize';
import { useOpenEncryptedPdf } from './hooks/useOpenEncryptedPdf';

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
	const uid = useId();
	const { t } = useTranslation();
	const openEncryptedPdf = useOpenEncryptedPdf();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleTitleClick = async (event: UIEvent): Promise<void> => {
		if (!link) {
			return;
		}

		const isEncrypted = link.includes('/file-decrypt/');

		try {
			if (format === 'PDF' && openDocumentViewer) {
				event.preventDefault();

				if (isEncrypted) {
					await openEncryptedPdf(link, title, size, format, openDocumentViewer);
					return;
				}

				const url = new URL(getURL(link), window.location.origin);
				url.searchParams.set('contentDisposition', 'inline');
				openDocumentViewer(url.toString(), format, '');
				return;
			}

			if (isEncrypted) {
				event.preventDefault();
				registerDownloadForUid(uid, t, title);
				forAttachmentDownload(uid, link);
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('FileUpload_Error_Trying_To_Open_File') });
		}
	};

	const getExternalUrl = () => {
		if (!hasDownload || !link) return undefined;

		if (openDocumentViewer) {
			const url = new URL(getURL(link), window.location.origin);
			url.searchParams.set('download', '');
			return url.toString();
		}

		return getURL(link);
	};

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={link} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<MessageGenericPreviewContent
						thumb={<MessageGenericPreviewIcon name='attachment-file' type={format || getFileExtension(title)} />}
					>
						<MessageGenericPreviewTitle download={!!openDocumentViewer} externalUrl={getExternalUrl()} onClick={handleTitleClick}>
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
