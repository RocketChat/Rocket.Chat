import { publishMeteorCollection } from './meteorCollection';
import { makeSession, makeSubscription, sentPackets } from '../__tests__/helpers';
import { Server } from '../ddp/Server';
import { MeteorCollection } from '../lib/MeteorCollection';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

describe('publishMeteorCollection', () => {
	let server: Server;
	let collection: MeteorCollection<{ name: string }>;

	beforeEach(() => {
		server = new Server();
		collection = new MeteorCollection();
		publishMeteorCollection(server, 'things.publication', 'things', collection);
	});

	async function subscribe(id = 'sub1') {
		const session = makeSession();
		await server.subscribe(session, { ...makeSubscription('things.publication'), id });
		return session;
	}

	it('replays the current records under the collection name and reports ready', async () => {
		collection.set('a', { name: 'first' });
		collection.set('b', { name: 'second' });
		collection.set('a', { name: 'first, updated' });

		const session = await subscribe();

		expect(sentPackets(session)).toEqual([
			{ msg: 'added', collection: 'things', id: 'a', fields: { name: 'first, updated' } },
			{ msg: 'added', collection: 'things', id: 'b', fields: { name: 'second' } },
			{ msg: 'ready', subs: ['sub1'] },
		]);
	});

	it('forwards added, changed and removed to an active subscriber', async () => {
		const session = await subscribe();
		session.send.mockClear();

		collection.set('a', { name: 'first' });
		collection.set('a', { name: 'renamed' });
		collection.remove('a');

		expect(sentPackets(session)).toEqual([
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

		collection.set('a', { name: 'first' });

		expect(stopped.send).not.toHaveBeenCalled();
		expect(sentPackets(active)).toEqual([{ msg: 'added', collection: 'things', id: 'a', fields: { name: 'first' } }]);
	});
});
