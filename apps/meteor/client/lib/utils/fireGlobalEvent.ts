import { Tracker } from 'meteor/tracker';

import { fireGlobalEventBase } from './fireGlobalEventBase';
import { settings } from '../../../app/settings/client';

export const fireGlobalEvent = (eventName: string, detail?: unknown): void => {
	const dispatchIframeMessage = fireGlobalEventBase(eventName, detail);

	Tracker.autorun((computation) => {
		const enabled = settings.get('Iframe_Integration_send_enable');
		if (enabled === undefined) {
			return;
		}

		computation.stop();

		dispatchIframeMessage(enabled, settings.get('Iframe_Integration_send_target_origin'));
	});
};
