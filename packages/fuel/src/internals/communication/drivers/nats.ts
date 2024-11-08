import type { NatsConnection } from 'nats';
import { connect } from 'nats';

import type { IInterProcessCommunicationDriver, InterProcessCommunicationStartParams } from '../definition';
import { ILogger } from '../../observability';

export class NatsDriver implements IInterProcessCommunicationDriver {
	private connection: NatsConnection | null = null;

	public async connect(options: InterProcessCommunicationStartParams, logger: ILogger): Promise<void> {
		try {
			if (!this.connection) {
				this.connection = await connect({ servers: options.url });
			}
		} catch (error) {
			logger.error(error as any);
		}
	}

	public getConnection<NatsConnection>(): NatsConnection {
		if (!this.connection) {
			throw new Error('Cannot retrieve a Nats connection, try to connect it first.');
		}

		return this.connection as NatsConnection;
	}
}
