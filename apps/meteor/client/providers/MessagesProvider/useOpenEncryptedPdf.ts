import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useId, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { forAttachmentDownload, registerDownloadForUid } from '../../hooks/useDownloadFromServiceWorker';
import { callDesktopBridge } from '../../lib/utils/callDesktopBridge';

/** How many opened files keep their blob; a viewer needs it for as long as the file is open, and memory has to stay bounded. */
const MAX_KEPT_ENCRYPTED_PDFS = 5;

export const useOpenEncryptedPdf = () => {
	const getURL = useMediaUrl();
	const pdfPreviewSizeLimit = callDesktopBridge((desktop) => desktop.getE2ePdfPreviewSizeLimit?.()) ?? 10;
	const pdfPreviewSizeLimitInBytes = pdfPreviewSizeLimit * 1024 * 1024;
	const uid = useId();
	const downloads = useRef(0);
	const { t } = useTranslation();

	// A file keeps its own blob and request, so opening one file never takes another one away from its viewer.
	const blobUrlsRef = useRef(new Map<string, string>());
	const abortControllersRef = useRef(new Map<string, AbortController>());

	useEffect(() => {
		const blobUrls = blobUrlsRef.current;
		const abortControllers = abortControllersRef.current;

		return () => {
			abortControllers.forEach((controller) => controller.abort());
			abortControllers.clear();
			blobUrls.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
			blobUrls.clear();
		};
	}, []);

	// Blobs are kept in the order they were opened, so the oldest ones are the first to go.
	const releaseLeastRecentlyOpened = () => {
		for (const [link, blobUrl] of blobUrlsRef.current) {
			if (blobUrlsRef.current.size <= MAX_KEPT_ENCRYPTED_PDFS) {
				return;
			}
			URL.revokeObjectURL(blobUrl);
			blobUrlsRef.current.delete(link);
		}
	};

	const openEncryptedPdf = async (
		link: string,
		title: string | undefined,
		size: number | undefined,
		format: string,
		openDocumentViewer: (url: string, format: string, options: any) => void,
	) => {
		if (size === undefined || size > pdfPreviewSizeLimitInBytes) {
			// Every download has its own id, so the answer to one request saves one file under its own title.
			const downloadId = `${uid}-${++downloads.current}`;
			registerDownloadForUid(downloadId, t, title);
			forAttachmentDownload(downloadId, link);
			return;
		}

		const previousBlobUrl = blobUrlsRef.current.get(link);
		if (previousBlobUrl) {
			URL.revokeObjectURL(previousBlobUrl);
			blobUrlsRef.current.delete(link);
		}

		abortControllersRef.current.get(link)?.abort();

		const abortController = new AbortController();
		abortControllersRef.current.set(link, abortController);

		try {
			const response = await fetch(getURL(link), {
				signal: abortController.signal,
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch encrypted PDF: ${response.status}`);
			}
			const blob = await response.blob();
			if (abortController.signal.aborted || abortControllersRef.current.get(link) !== abortController) {
				return;
			}
			const blobUrl = URL.createObjectURL(blob);
			blobUrlsRef.current.set(link, blobUrl);
			releaseLeastRecentlyOpened();
			openDocumentViewer(blobUrl, format, title ?? '');
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				console.error('Error opening preview of encrypted PDF', error);
				throw error;
			}
		} finally {
			if (abortControllersRef.current.get(link) === abortController) {
				abortControllersRef.current.delete(link);
			}
		}
	};

	return openEncryptedPdf;
};
