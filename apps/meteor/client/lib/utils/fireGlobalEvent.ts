import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings/client';

export const fireGlobalEvent = (eventName: string, detail?: unknown): void => {
	window.dispatchEvent(new CustomEvent(eventName, { detail }));

	Tracker.autorun((computation) => {
		const enabled = settings.get('Iframe_Integration_send_enable');
		if (enabled === undefined) {
			return;
		}

		computation.stop();

		if (enabled) {
			parent.postMessage(
				{
					eventName,
					data: detail,
				},
				settings.get('Iframe_Integration_send_target_origin'),
			);
		}
	});
};
