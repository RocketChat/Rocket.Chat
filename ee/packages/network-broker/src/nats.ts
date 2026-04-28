import { NatsBroker } from './NatsBroker';

const { TRANSPORTER = 'nats://localhost:4222' } = process.env;

export function startNatsBroker(): NatsBroker {
	return new NatsBroker({ servers: TRANSPORTER });
}
