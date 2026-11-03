import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Fullscreen = {
	/** False where the browser cannot show an element fullscreen, as on an iPhone. */
	available: boolean;
	fullscreen: boolean;
	toggle: () => void;
};

/** Shows whatever element the returned ref is attached to fullscreen, and back. */
export const useFullscreen = (): [ref: RefCallback<HTMLElement>, fullscreen: Fullscreen] => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [element, setElement] = useState<HTMLElement | null>(null);
	const [fullscreen, setFullscreen] = useState(false);

	const ref = useCallback((node: HTMLElement) => {
		const document = node.ownerDocument;
		const update = () => setFullscreen(document.fullscreenElement === node);

		setElement(node);
		update();
		document.addEventListener('fullscreenchange', update);

		return () => {
			document.removeEventListener('fullscreenchange', update);
			setElement(null);
		};
	}, []);

	const toggle = useCallback(() => {
		if (!element) {
			return;
		}

		const { ownerDocument } = element;
		const request = ownerDocument.fullscreenElement === element ? ownerDocument.exitFullscreen() : element.requestFullscreen();
		request.catch(() => dispatchToastMessage({ type: 'error', message: t('Fullscreen_failed_to_switch_not_allowed') }));
	}, [element, dispatchToastMessage, t]);

	return [ref, { available: element?.ownerDocument.fullscreenEnabled ?? false, fullscreen, toggle }];
};
