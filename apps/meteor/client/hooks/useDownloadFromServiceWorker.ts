import { Emitter } from '@rocket.chat/emitter';
import type { TFunction } from 'i18next';
import type { MouseEvent } from 'react';
import { useId, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { downloadAs } from '../lib/download';

const ee = new Emitter<Record<string, { result: ArrayBuffer; id: string }>>();

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data.type === 'attachment-download-result') {
			const { result } = event.data as { result: ArrayBuffer; id: string };

			ee.emit(event.data.id, { result, id: event.data.id });
		}
	});
}

export const registerDownloadForUid = (uid: string, t: TFunction, title?: string) => {
	ee.once(uid, ({ result }) => {
		downloadAs({ data: [new Blob([result])] }, title ?? t('Download'));
	});
};

export const forAttachmentDownload = (uid: string, href: string, controller?: ServiceWorker | null) => {
	if (!controller) {
		controller = navigator?.serviceWorker?.controller;
	}

	if (!controller) {
		return;
	}

	controller?.postMessage({
		type: 'attachment-download',
		url: href,
		id: uid,
	});
};

export const useDownloadFromServiceWorker = (href: string, title?: string) => {
	const { controller } = navigator?.serviceWorker || {};

	const uid = useId();

	const { t } = useTranslation();

	useEffect(() => registerDownloadForUid(uid, t, title), [title, t, uid]);

	return {
		disabled: !controller,
		onContextMenu: useCallback((e: MouseEvent) => e.preventDefault(), []),
		onClick: useCallback(
			(e: MouseEvent) => {
				e.preventDefault();

				forAttachmentDownload(uid, href, controller);
			},
			[href, uid, controller],
		),
	};
};
