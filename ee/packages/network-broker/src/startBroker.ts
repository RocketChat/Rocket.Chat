import type { IBroker } from '@rocket.chat/core-services';
import type Moleculer from 'moleculer';

import { startMoleculerBroker } from './moleculer';
import { startNatsBroker } from './nats';

const { BROKER = 'moleculer' } = process.env;

export function startBroker(options: Moleculer.BrokerOptions = {}): IBroker {
	if (BROKER === 'nats') {
		return startNatsBroker(options.nodeID ?? undefined);
	}

	return startMoleculerBroker(options);
}
