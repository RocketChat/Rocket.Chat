import { fireGlobalEventBase } from './fireGlobalEventBase';
import { settings } from '../settings';

export const fireGlobalEvent = (eventName: string, detail?: unknown): void => {
	const dispatchIframeMessage = fireGlobalEventBase(eventName, detail);

	const enabled = settings.peek('Iframe_Integration_send_enable');
	if (enabled === undefined) {
		return;
	}

	dispatchIframeMessage(enabled, settings.peek('Iframe_Integration_send_target_origin') ?? '*');
};
