import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { MessageMediaContextValue } from '@rocket.chat/ui-message-list';
import { useId, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useOpenEncryptedPdf } from './useOpenEncryptedPdf';
import { forAttachmentDownload, registerDownloadForUid } from '../../hooks/useDownloadFromServiceWorker';
import { useFormatMemorySize } from '../../hooks/useFormatMemorySize';
import { useMediaPlayer } from '../MediaPlayerProvider';

const getDocumentViewer = () => {
	const desktop = window.RocketChatDesktop;
	const open = desktop?.openDocumentViewer;
	if (!open) {
		return undefined;
	}

	return {
		supportedFormats: desktop.supportedDocumentViewerFormats?.() ?? [],
		open: (url: string, format: string) => open(url, format, ''),
	};
};

/** The app-wide audio player, downloads through the service worker that decrypts files, and the desktop document viewer. */
export const useMessageMediaValue = (): MessageMediaContextValue => {
	const player = useMediaPlayer();
	const openEncryptedPdf = useStableCallback(useOpenEncryptedPdf());
	const formatFileSize = useFormatMemorySize();
	const uid = useId();
	const downloadCount = useRef(0);
	const { t } = useTranslation();

	const canDownloadEncrypted = !!navigator?.serviceWorker?.controller;

	return useMemo(() => {
		const documentViewer = getDocumentViewer();

		return {
			player,
			downloadEncrypted: (link, title) => {
				const downloadId = `${uid}-${++downloadCount.current}`;
				registerDownloadForUid(downloadId, t, title);
				forAttachmentDownload(downloadId, link);
			},
			canDownloadEncrypted,
			openEncryptedPdf: async (link, { title, size, format }) => {
				if (!documentViewer) {
					return;
				}
				await openEncryptedPdf(link, title, size, format ?? 'PDF', documentViewer.open);
			},
			documentViewer,
			formatFileSize,
		};
	}, [player, uid, t, canDownloadEncrypted, openEncryptedPdf, formatFileSize]);
};
