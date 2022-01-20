import * as domEvents from '../lib/utils/domEvents';
import { isIOsDevice } from '../lib/utils/isIOsDevice';

((): void => {
	if (!isIOsDevice || !window.matchMedia('(hover: none)').matches) {
		return;
	}

	domEvents.delegate({
		parent: document.body,
		eventName: 'touchend',
		elementSelector: 'a:hover',
		listener: (_, element): void => {
			domEvents.triggerClick(element);
		},
	});
})();
