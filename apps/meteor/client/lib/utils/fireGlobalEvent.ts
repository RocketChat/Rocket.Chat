import { fireGlobalEventBase } from './fireGlobalEventBase';
import { settings } from '../../../app/settings/client';

export const fireGlobalEvent = (eventName: string, detail?: unknown): void => {
	const dispatchIframeMessage = fireGlobalEventBase(eventName, detail);

	const enabled = settings.get('Iframe_Integration_send_enable');
	if (enabled === undefined) {
		return;
	}

	dispatchIframeMessage(enabled, settings.get('Iframe_Integration_send_target_origin'));
};
