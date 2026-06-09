import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useId, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { forAttachmentDownload, registerDownloadForUid } from '../../../../../../hooks/useDownloadFromServiceWorker';

export const useOpenEncryptedPdf = () => {
	const getURL = useMediaUrl();
	const pdfPreviewSizeLimit = window.RocketChatDesktop?.getE2ePdfPreviewSizeLimit?.() ?? 10;
	const pdfPreviewSizeLimitInBytes = pdfPreviewSizeLimit * 1024 * 1024;
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

	const openEncryptedPdf = async (
		link: string,
		title: string | undefined,
		size: number | undefined,
		format: string,
		openDocumentViewer: (url: string, format: string, options: any) => void,
	) => {
		if (size === undefined || size > pdfPreviewSizeLimitInBytes) {
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

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			const response = await fetch(getURL(link), {
				signal: abortController.signal,
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch encrypted PDF: ${response.status}`);
			}
			const blob = await response.blob();
			if (abortController.signal.aborted || abortControllerRef.current !== abortController) {
				return;
			}
			const blobUrl = URL.createObjectURL(blob);
			blobUrlRef.current = blobUrl;
			openDocumentViewer(blobUrl, format, title ?? '');
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				console.error('Error opening preview of encrypted PDF', error);
				throw error;
			}
		}
	};

	return openEncryptedPdf;
};
