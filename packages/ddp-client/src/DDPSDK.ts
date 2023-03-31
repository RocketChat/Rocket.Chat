import type { ClientStream } from './ClientStream';
import { ClientStreamImpl } from './ClientStream';
import { ConnectionImpl } from './Connection';
import { MinimalDDPClient } from './MinimalDDPClient';
import { TimeoutControl } from './TimeoutControl';

export class DDPSDK {
	static async create(url: string): Promise<ClientStream> {
		const websocket = new WebSocket(url);

		const ddp = new MinimalDDPClient((data) => {
			websocket.send(data);
		});

		const connection = new ConnectionImpl(websocket as any, ddp);

		const timeout = TimeoutControl.create(ddp, connection);

		websocket.onmessage = (event) => {
			timeout.reset();
			ddp.handleMessage(String(event.data));
		};

		const client = new ClientStreamImpl(ddp);

		await connection.connect();

		return client;
	}
}
