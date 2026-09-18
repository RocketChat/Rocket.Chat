import { Publication } from './Publication';
import { Server } from './Server';
import { makeClient, makeSubscription, sentPackets } from './__tests__/helpers';

describe('Publication', () => {
	let client: ReturnType<typeof makeClient>;
	let server: Server;
	let publication: Publication;

	beforeEach(() => {
		client = makeClient();
		server = new Server();
		publication = new Publication(client, makeSubscription(), server);
	});

	it('registers itself under the subscription ID', () => {
		expect(client.subscriptions.get('test-id')).toBe(publication);
	});

	it('removes only its own subscription and sends nosub on explicit stop', () => {
		const other = new Publication(client, { ...makeSubscription(), id: 'other-id' }, server);

		publication.stop();

		expect(client.subscriptions.has('test-id')).toBe(false);
		expect(client.subscriptions.get('other-id')).toBe(other);
		expect(sentPackets(client)).toEqual([{ msg: 'nosub', id: 'test-id' }]);
	});

	it('cleans up all publications when the client disconnects', () => {
		const other = new Publication(client, { ...makeSubscription(), id: 'other-id' }, server);
		const onStop = jest.fn();
		const onOtherStop = jest.fn();
		publication.onStop(onStop);
		other.onStop(onOtherStop);

		client.emit('close');

		expect(client.subscriptions.size).toBe(0);
		expect(onStop).toHaveBeenCalledTimes(1);
		expect(onOtherStop).toHaveBeenCalledTimes(1);
		expect(client.send).not.toHaveBeenCalled();
	});

	it('runs each stop callback only once across repeated stops and disconnection', () => {
		const first = jest.fn();
		const second = jest.fn();
		publication.onStop(first);
		publication.onStop(second);

		publication.stop();
		publication.stop();
		client.emit('close');

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('notifies the client that its subscription is ready', () => {
		publication.ready();

		expect(sentPackets(client)).toEqual([{ msg: 'ready', subs: ['test-id'] }]);
	});

	it('reads the current client user ID and returns null when logged out', () => {
		expect(publication.userId).toBe('user1');
		client.userId = 'user2';
		expect(publication.userId).toBe('user2');
		client.userId = undefined;
		expect(publication.userId).toBeNull();
	});

	it('exposes the session socket, initial user, connection, and bound sendAdded', () => {
		expect(publication.connection).toBe(client.connection);
		expect(publication._session?.socket).toBe(client);
		expect(publication._session?.userId).toBe('user1');
		const sendAdded = publication._session?.sendAdded;
		expect(sendAdded).toBeDefined();

		sendAdded?.('messages', 'message1', { text: 'hello' });

		expect(sentPackets(client)).toEqual([{ msg: 'added', collection: 'messages', id: 'message1', fields: { text: 'hello' } }]);
	});

	it('allows a session without an authenticated user', () => {
		client.userId = undefined;
		const anonymous = new Publication(client, { ...makeSubscription(), id: 'anonymous' }, server);

		expect(anonymous.userId).toBeNull();
		expect(anonymous._session?.userId).toBeUndefined();
	});

	it('reports whether a session is available', () => {
		expect(publication._isDeactivated()).toBe(false);
		publication._session = null;
		expect(publication._isDeactivated()).toBe(true);
	});

	it('sends collection additions, changes, and removals', () => {
		publication.added('messages', 'message1', { text: 'hello' });
		publication.changed('messages', 'message1', { text: 'updated' });
		publication.removed('messages', 'message1');

		expect(sentPackets(client)).toEqual([
			{ msg: 'added', collection: 'messages', id: 'message1', fields: { text: 'hello' } },
			{ msg: 'changed', collection: 'messages', id: 'message1', fields: { text: 'updated' } },
			{ msg: 'removed', collection: 'messages', id: 'message1' },
		]);
	});

	it('rejects the unsupported error operation', () => {
		expect(() => publication.error(new Error('failure'))).toThrow('Method not implemented.');
		expect(client.send).not.toHaveBeenCalled();
	});

	it('rejects the unsupported unblock operation', () => {
		expect(() => publication.unblock()).toThrow('Method not implemented.');
		expect(client.send).not.toHaveBeenCalled();
	});
});
