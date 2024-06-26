import { Emitter } from '@rocket.chat/emitter';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { downloadAs } from '../lib/download';

const ee = new Emitter<Record<string, { result: ArrayBuffer; id: string }>>();

navigator.serviceWorker.addEventListener('message', (event) => {
	if (event.data.type === 'attachment-download-result') {
		const { result } = event.data as { result: ArrayBuffer; id: string };

		ee.emit(event.data.id, { result, id: event.data.id });
	}
});

export const useDownloadFromServiceWorker = (href: string, title?: string) => {
	const { controller } = navigator.serviceWorker;

	const uid = useUniqueId();

	const { t } = useTranslation();

	useEffect(
		() =>
			ee.once(uid, ({ result }) => {
				downloadAs({ data: [new Blob([result])] }, title ?? t('Download'));
			}),
		[title, t, uid],
	);

	return {
		disabled: !controller,
		onContextMenu: useCallback((e) => e.preventDefault(), []),
		onClick: useCallback(
			(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
				e.preventDefault();

				controller?.postMessage({
					type: 'attachment-download',
					url: href,
					id: uid,
				});
			},
			[href, uid, controller],
		),
	};
};
