import { useAbsoluteUrl, useLayout } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';

export const useMessageLinkClicks = () => {
	const absoluteUrl = useAbsoluteUrl();
	const { isEmbedded: embeddedLayout } = useLayout();

	useEffect(() => {
		if (!embeddedLayout) {
			return;
		}

		const handleMessageLinkClick = (event: Event) => {
			const element = event.currentTarget as Element | null;

			if (!element || !(element instanceof HTMLElement)) {
				return;
			}

			if (!(element instanceof HTMLAnchorElement)) {
				return;
			}

			if (element.origin !== absoluteUrl('').replace(/\/+$/, '') || !/msg=([a-zA-Z0-9]+)/.test(element.search)) {
				return;
			}

			fireGlobalEvent('click-message-link', { link: element.pathname + element.search });
		};

		document.body.addEventListener('click', handleMessageLinkClick);

		return () => {
			document.body.removeEventListener('click', handleMessageLinkClick);
		};
	}, [absoluteUrl, embeddedLayout]);
};
