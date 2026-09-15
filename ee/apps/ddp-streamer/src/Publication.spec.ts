import { EventEmitter } from 'events';

import type { Client } from './Client';
import { Publication } from './Publication';
import type { Server } from './Server';
import type { IPacket } from './types/IPacket';

function makeClient(): Client {
	return Object.assign(new EventEmitter(), {
		subscriptions: new Map(),
		userId: 'user1',
		connection: {},
	}) as unknown as Client;
}

function makeServer(): Server {
	return {
		nosub: jest.fn(),
	} as unknown as Server;
}

function makePacket(id: string): IPacket {
	return {
		name: 'stream-notify-user',
		id,
		method: '',
		msg: 'sub',
		version: '',
		support: [],
		params: [],
	};
}

describe('Publication', () => {
	it('removes the client close listener when the publication stops', () => {
		const client = makeClient();
		const server = makeServer();
		const publication = new Publication(client, makePacket('subscription'), server);

		expect(client.listenerCount('close')).toBe(1);

		publication.stop();

		expect(client.listenerCount('close')).toBe(0);
		expect(client.subscriptions.has('subscription')).toBe(false);
	});

	it('does not accumulate close listeners during subscription churn', () => {
		const client = makeClient();
		const server = makeServer();

		for (let index = 0; index < 51; index++) {
			new Publication(client, makePacket(`subscription-${index}`), server).stop();
		}

		expect(client.listenerCount('close')).toBe(0);
		expect(client.subscriptions.size).toBe(0);
	});

	it('stops the publication when the client closes', () => {
		const client = makeClient();
		const packet = makePacket('subscription');
		const publication = new Publication(client, packet, makeServer());
		const onStop = jest.fn();
		publication.onStop(onStop);

		client.emit('close');

		expect(onStop).toHaveBeenCalledWith(client, packet);
		expect(client.listenerCount('close')).toBe(0);
		expect(client.subscriptions.has('subscription')).toBe(false);
	});
});
