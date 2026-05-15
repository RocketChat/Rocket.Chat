import type { MessageAttachmentBase } from '@rocket.chat/core-typings';
import {
	MessageGenericPreview,
	MessageGenericPreviewContent,
	MessageGenericPreviewIcon,
	MessageGenericPreviewTitle,
	MessageGenericPreviewDescription,
} from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useId, useEffect, useRef } from 'react';
import type { UIEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { getFileExtension } from '../../../../../../lib/utils/getFileExtension';
import { forAttachmentDownload, registerDownloadForUid } from '../../../../../hooks/useDownloadFromServiceWorker';
import { MAX_FILE_SIZE_PREVIEW } from '../../../../../lib/constants';
import MessageCollapsible from '../../../MessageCollapsible';
import AttachmentSize from '../structure/AttachmentSize';

const openDocumentViewer = window.RocketChatDesktop?.openDocumentViewer;

type GenericFileAttachmentProps = MessageAttachmentBase;

const GenericFileAttachment = ({
	title,
	title_link: link,
	title_link_download: hasDownload,
	size,
	format,
	collapsed,
}: GenericFileAttachmentProps) => {
	const getURL = useMediaUrl();
	const uid = useId();
	const { t } = useTranslation();

	const blobUrlRef = useRef<string | undefined>(undefined);
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current);
				blobUrlRef.current = undefined;
			}
		};
	}, []);

	const handleTitleClick = async (event: UIEvent): Promise<void> => {
		if (!link) {
			return;
		}

		const isEncrypted = link.includes('/file-decrypt/');

		if (format === 'PDF' && openDocumentViewer) {
			event.preventDefault();

			if (isEncrypted) {
				if (size && size > MAX_FILE_SIZE_PREVIEW) {
					registerDownloadForUid(uid, t, title);
					forAttachmentDownload(uid, link);
					return;
				}

				if (blobUrlRef.current) {
					URL.revokeObjectURL(blobUrlRef.current);
					blobUrlRef.current = undefined;
				}

				if (abortControllerRef.current) {
					abortControllerRef.current.abort();
				}
				abortControllerRef.current = new AbortController();

				try {
					const response = await fetch(getURL(link), {
						signal: abortControllerRef.current.signal,
					});
					const blob = await response.blob();
					if (abortControllerRef.current.signal.aborted) {
						return;
					}
					const blobUrl = URL.createObjectURL(blob);
					blobUrlRef.current = blobUrl;
					openDocumentViewer(blobUrl, format, title ?? '');
				} catch (error: any) {
					if (error.name !== 'AbortError') {
						console.error('Error fetching encrypted PDF', error);
					}
				}
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
