import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

import { NatsBroker } from './NatsBroker';

const { NATS_URL, TRANSPORTER, REQUEST_TIMEOUT = '60', BROKER_LOCAL_ROUTING } = process.env;

// an empty value counts as unset, which a destructuring default would not do
const servers = NATS_URL || TRANSPORTER || 'nats://localhost:4222';

export function startNatsBroker(nodeID?: string): NatsBroker {
	return new NatsBroker({ servers }, nodeID || `${hostname().toLowerCase()}-${randomUUID()}`, {
		requestTimeout: (parseInt(REQUEST_TIMEOUT) || 60) * 1000,
		localRouting: BROKER_LOCAL_ROUTING !== 'false',
	});
}
