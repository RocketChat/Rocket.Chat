import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

import { NatsBroker } from './NatsBroker';

const { NATS_URL, TRANSPORTER, SKIP_PROCESS_EVENT_REGISTRATION = 'false', REQUEST_TIMEOUT = '60', BROKER_LOCAL_ROUTING } = process.env;

// TRANSPORTER is the Moleculer transporter string and is kept as a fallback; note
// that compose passes it through as an empty string when unset, so `||` is used
// instead of a destructuring default.
const servers = NATS_URL || TRANSPORTER || 'nats://localhost:4222';

/** Stopping the container stops every service and lets `exit` hooks run. */
function stopOnSignal(broker: NatsBroker): void {
	const stop = (): void => {
		void broker
			.stop()
			.catch((err) => console.error('NatsBroker failed to stop', err))
			.finally(() => process.exit(0));
	};

	process.once('SIGTERM', stop);
	process.once('SIGINT', stop);
}

export function startNatsBroker(nodeID?: string): NatsBroker {
	const broker = new NatsBroker({ servers }, nodeID || `${hostname().toLowerCase()}-${randomUUID()}`, {
		requestTimeout: (parseInt(REQUEST_TIMEOUT) || 60) * 1000,
		localRouting: BROKER_LOCAL_ROUTING !== 'false',
	});

	if (SKIP_PROCESS_EVENT_REGISTRATION !== 'true') {
		stopOnSignal(broker);
	}

	return broker;
}
