import { getLocalSrc } from './getLocalSrc';
// import { logger } from './logger';
import { handleEvents } from '../handler';

export function dispatchEvents(events, domains) {
	domains = domains || [getLocalSrc()];

	// logger.dispatcher.debug(() => `dispatchEvents => domains=${ domains.join(', ') } events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);

	for (const domain of domains) {
		if (domain !== getLocalSrc()) {
			// Federated - handle dispatching the events
			continue;
		}

		// Local - directly handle the events
		handleEvents(events);
	}
}

export function dispatchEvent(event, domains) {
	dispatchEvents([event], domains);
}
