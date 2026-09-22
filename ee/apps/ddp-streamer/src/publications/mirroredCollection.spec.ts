import { publishMirroredCollection } from './mirroredCollection';
import { makeClient, makeSubscription, sentPackets } from '../__tests__/helpers';
import { Server } from '../ddp/Server';
import { MirroredCollection } from '../lib/MirroredCollection';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

describe('publishMirroredCollection', () => {
	let server: Server;
	let mirror: MirroredCollection<{ name: string }>;

	beforeEach(() => {
		server = new Server();
		mirror = new MirroredCollection();
		publishMirroredCollection(server, 'things.publication', 'things', mirror);
	});

	async function subscribe(id = 'sub1') {
		const client = makeClient();
		await server.subscribe(client, { ...makeSubscription('things.publication'), id });
		return client;
	}

	it('replays the current records under the collection name and reports ready', async () => {
		mirror.set('a', { name: 'first' });
		mirror.set('b', { name: 'second' });
		mirror.set('a', { name: 'first, updated' });

		const client = await subscribe();

		expect(sentPackets(client)).toEqual([
			{ msg: 'added', collection: 'things', id: 'a', fields: { name: 'first, updated' } },
			{ msg: 'added', collection: 'things', id: 'b', fields: { name: 'second' } },
			{ msg: 'ready', subs: ['sub1'] },
		]);
	});

	it('forwards added, changed and removed to an active subscriber', async () => {
		const client = await subscribe();
		client.send.mockClear();

		mirror.set('a', { name: 'first' });
		mirror.set('a', { name: 'renamed' });
		mirror.remove('a');

		expect(sentPackets(client)).toEqual([
			{ msg: 'added', collection: 'things', id: 'a', fields: { name: 'first' } },
			{ msg: 'changed', collection: 'things', id: 'a', fields: { name: 'renamed' } },
			{ msg: 'removed', collection: 'things', id: 'a' },
		]);
	});

	it('stops forwarding once the subscription stops, without affecting other subscribers', async () => {
		const stopped = await subscribe('stopped');
		const active = await subscribe('active');
		stopped.subscriptions.get('stopped')?.stop();
		stopped.send.mockClear();
		active.send.mockClear();

		mirror.set('a', { name: 'first' });

		expect(stopped.send).not.toHaveBeenCalled();
		expect(sentPackets(active)).toEqual([{ msg: 'added', collection: 'things', id: 'a', fields: { name: 'first' } }]);
	});
});
