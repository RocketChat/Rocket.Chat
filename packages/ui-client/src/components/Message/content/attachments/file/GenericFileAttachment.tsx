import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import {
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewIcon,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
} from '@rocket.chat/fuselage';
import { useMediaUrl, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';
import type { UIEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkdownTextContext } from '../../../../MarkdownTextContext';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';
import { useMessageMedia } from '../../../contexts/MessageMediaContext';
import { getFileExtension } from '../../../lib/getFileExtension';
import AttachmentSize from '../structure/AttachmentSize';

// `format` comes from getFileExtension, which upper-cases the extension.
const MARKDOWN_FILE_FORMATS = ['MD', 'MARKDOWN'];

export type GenericFileAttachmentProps = MessageAttachmentBase;

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
	const { t } = useTranslation();
	const MarkdownText = useContext(MarkdownTextContext);
	const { documentViewer, openEncryptedPdf, downloadEncrypted } = useMessageMedia();
	const dispatchToastMessage = useToastMessageDispatch();

	const getInlineUrl = (link: string) => {
		const url = new URL(getURL(link), window.location.origin);
		url.searchParams.set('contentDisposition', 'inline');
		return url.toString();
	};

	const handleTitleClick = async (event: UIEvent): Promise<void> => {
		if (!link) {
			return;
		}

		const isEncrypted = link.includes('/file-decrypt/');
		const isMarkdown = MARKDOWN_FILE_FORMATS.includes(format ?? '');

		try {
			if (format === 'PDF' && documentViewer) {
				event.preventDefault();

				if (isEncrypted) {
					await openEncryptedPdf(link, { title, size, format });
					return;
				}

				documentViewer.open(getInlineUrl(link), format);
				return;
			}

			if (isMarkdown && !isEncrypted && documentViewer?.supportedFormats.includes('markdown')) {
				event.preventDefault();

				documentViewer.open(getInlineUrl(link), 'markdown');
				return;
			}

			if (isEncrypted) {
				event.preventDefault();
				downloadEncrypted(link, title);
			}
		} catch {
			dispatchToastMessage({ type: 'error', message: t('FileUpload_Error_Trying_To_Open_File') });
		}
	};

	const getExternalUrl = () => {
		if (!hasDownload || !link) return undefined;

		if (documentViewer) {
			const url = new URL(getURL(link), window.location.origin);
			url.searchParams.set('download', '');
			return url.toString();
		}

		return getURL(link);
	};

	return (
		<>
			{descriptionMd ? (
				<MessageContentBody md={descriptionMd} msg={description} />
			) : (
				<MarkdownText parseEmoji content={description ?? ''} />
			)}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={link} isCollapsed={collapsed}>
				<MessageGenericPreview style={{ maxWidth: 368, width: '100%' }}>
					<MessageGenericPreviewContent
						thumb={<MessageGenericPreviewIcon name='attachment-file' type={format || getFileExtension(title)} />}
					>
						<MessageGenericPreviewTitle download={!!documentViewer} externalUrl={getExternalUrl()} onClick={handleTitleClick}>
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
