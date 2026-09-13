import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

import { NatsBroker } from './NatsBroker';

const { NATS_URL, TRANSPORTER } = process.env;

// TRANSPORTER is the Moleculer transporter string and is kept as a fallback; note
// that compose passes it through as an empty string when unset, so `||` is used
// instead of a destructuring default.
const servers = NATS_URL || TRANSPORTER || 'nats://localhost:4222';

export function startNatsBroker(nodeID?: string): NatsBroker {
	return new NatsBroker({ servers }, nodeID || `${hostname().toLowerCase()}-${randomUUID()}`);
}
