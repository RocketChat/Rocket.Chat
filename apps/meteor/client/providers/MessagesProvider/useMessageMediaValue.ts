import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { MessageMediaContextValue } from '@rocket.chat/ui-message-list';
import { createMediaPlayerStore } from '@rocket.chat/ui-message-list';
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOpenEncryptedPdf } from './useOpenEncryptedPdf';
import { forAttachmentDownload, registerDownloadForUid } from '../../hooks/useDownloadFromServiceWorker';
import { useFormatMemorySize } from '../../hooks/useFormatMemorySize';
import { useMediaPlayer } from '../MediaPlayerProvider';

const getDocumentViewer = (): MessageMediaContextValue['documentViewer'] => {
	const desktop = window.RocketChatDesktop;
	const open = desktop?.openDocumentViewer;
	if (!desktop || !open) {
		return undefined;
	}

	return {
		get supportedFormats() {
			return desktop.supportedDocumentViewerFormats?.() ?? [];
		},
		open: (url, format, title = '') => open(url, format, title),
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

	// The player changes with every tick of its progress; its readers subscribe to the store, so the value below does not.
	const [playerStore] = useState(() => createMediaPlayerStore(player));
	useLayoutEffect(() => playerStore.set(player), [playerStore, player]);

	return useMemo(() => {
		const downloadEncrypted: MessageMediaContextValue['downloadEncrypted'] = (link, title) => {
			const downloadId = `${uid}-${++downloadCount.current}`;
			registerDownloadForUid(downloadId, t, title);
			forAttachmentDownload(downloadId, link);
		};
		const documentViewer = getDocumentViewer();

		return {
			player: playerStore,
			downloadEncrypted,
			// Read when a button renders, so a service worker that takes control later enables the buttons that render after it.
			get canDownloadEncrypted() {
				return !!navigator?.serviceWorker?.controller;
			},
			openEncryptedPdf: async (link, { title, size, format }) => {
				if (!documentViewer) {
					downloadEncrypted(link, title);
					return;
				}
				await openEncryptedPdf(link, title, size, format ?? 'PDF', documentViewer.open);
			},
			documentViewer,
			formatFileSize,
		};
	}, [playerStore, uid, t, openEncryptedPdf, formatFileSize]);
};
