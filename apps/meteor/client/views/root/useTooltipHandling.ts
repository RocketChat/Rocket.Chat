import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { tooltip } from '../../../app/ui/client/components/tooltip';
import * as domEvents from '../../lib/utils/domEvents';

export const useTooltipHandling = (): void => {
	useEffect(() => {
		tooltip.init();
	}, []);

	const hideUsernames = useUserPreference('hideUsernames', false);

	useEffect(() => {
		if (!hideUsernames) {
			return;
		}

		const detachMouseEnter = domEvents.delegate({
			parent: document.body,
			eventName: 'mouseenter',
			elementSelector: 'button.thumb',
			listener: (event, element) => {
				const username = element instanceof HTMLElement ? element.dataset.username : null;
				if (!username) {
					return;
				}

				event.stopPropagation();
				const span = document.createElement('span');
				span.innerText = username;
				tooltip.showElement(span, element);
			},
		});

		const detachMouseLeave = domEvents.delegate({
			parent: document.body,
			eventName: 'mouseleave',
			elementSelector: 'button.thumb',
			listener: () => {
				tooltip.hide();
			},
		});

		return (): void => {
			detachMouseEnter();
			detachMouseLeave();
		};
	}, [hideUsernames]);
};
