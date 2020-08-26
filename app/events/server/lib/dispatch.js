import { getLocalSrc } from './getLocalSrc';
import { logger } from './logger';
import { dispatchEvents as federationDispatchEvents } from '../../../federation/server/handler';
import { handleEvents } from '../handler';
import { Messages, Rooms } from '../../../models/server';
import { isFederationEnabled } from '../../../federation/server/lib/isFederationEnabled';

export async function dispatchEvents(events, domains, counter) {
	console.time(`[${ counter }] domains`);
	domains = domains || [getLocalSrc()];
	console.timeEnd(`[${ counter }] domains`);

	console.time(`[${ counter }] debug log`);
	logger.dispatcher.debug(() => `dispatchEvents => domains=${ domains.join(', ') } events=${ events.map((e) => JSON.stringify(e, null, 2)) }`);
	console.timeEnd(`[${ counter }] debug log`);

	console.time(`[${ counter }] federation enabled`);
	const fedEnabled = isFederationEnabled();
	console.timeEnd(`[${ counter }] federation enabled`);

	if (fedEnabled) {
		console.time(`[${ counter }] dispatchEvents`);
		// Dispatch federated events
		await federationDispatchEvents(domains.filter((d) => d !== getLocalSrc()));
		console.timeEnd(`[${ counter }] dispatchEvents`);
	}

	// Handle the local events
	console.time(`[${ counter }] handleEvents`);
	await handleEvents(events, counter);
	console.timeEnd(`[${ counter }] handleEvents`);
}

export async function dispatchEvent(event, domains, counter) {
	await dispatchEvents([event], domains, counter);
}

Messages.registerEventDispatcher(dispatchEvent);
Rooms.registerEventDispatcher(dispatchEvent);
