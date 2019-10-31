import { getLocalSrc } from './getLocalSrc';
import { logger } from './logger';
import { dispatchEvents as federationDispatchEvents } from '../../../federation/server/handler';
import { handleEvents } from '../handler';
import { Messages } from '../../../models/server';
import { isFederationEnabled } from '../../../federation/server/lib/isFederationEnabled';

export async function dispatchEvents(events, domains) {
	domains = domains || [getLocalSrc()];

	logger.dispatcher.debug(() => `dispatchEvents => domains=${ domains.join(', ') } events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);

	if (isFederationEnabled()) {
		// Dispatch federated events
		await federationDispatchEvents(domains.filter((d) => d !== getLocalSrc()));
	}

	// Handle the local events
	await handleEvents(events);
}

export async function dispatchEvent(event, domains) {
	await dispatchEvents([event], domains);
}

Messages.on('dispatchEvent', dispatchEvent);
