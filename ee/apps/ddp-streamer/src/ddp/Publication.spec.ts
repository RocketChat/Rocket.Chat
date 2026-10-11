import { Publication } from './Publication';
import { makeSession, makeSubscription, sentPackets } from '../__tests__/helpers';

describe('Publication', () => {
	let session: ReturnType<typeof makeSession>;
	let publication: Publication;

	beforeEach(() => {
		session = makeSession();
		publication = new Publication(session, makeSubscription());
	});

	it('registers itself under the subscription ID', () => {
		expect(session.subscriptions.get('test-id')).toBe(publication);
	});

	it('removes only its own subscription and sends nosub on explicit stop', () => {
		const other = new Publication(session, { ...makeSubscription(), id: 'other-id' });

		publication.stop();

		expect(session.subscriptions.has('test-id')).toBe(false);
		expect(session.subscriptions.get('other-id')).toBe(other);
		expect(sentPackets(session)).toEqual([{ msg: 'nosub', id: 'test-id' }]);
	});

	it('cleans up all publications when the session disconnects', () => {
		const other = new Publication(session, { ...makeSubscription(), id: 'other-id' });
		const onStop = jest.fn();
		const onOtherStop = jest.fn();
		publication.onStop(onStop);
		other.onStop(onOtherStop);

		session.emit('close');

		expect(session.subscriptions.size).toBe(0);
		expect(onStop).toHaveBeenCalledTimes(1);
		expect(onOtherStop).toHaveBeenCalledTimes(1);
		expect(session.send).not.toHaveBeenCalled();
	});

	it('runs each stop callback only once across repeated stops and disconnection', () => {
		const first = jest.fn();
		const second = jest.fn();
		publication.onStop(first);
		publication.onStop(second);

		publication.stop();
		publication.stop();
		session.emit('close');

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('notifies the session that its subscription is ready', () => {
		publication.ready();

		expect(sentPackets(session)).toEqual([{ msg: 'ready', subs: ['test-id'] }]);
	});

	it('reads the current session user ID and returns null when logged out', () => {
		expect(publication.userId).toBe('user1');
		session.userId = 'user2';
		expect(publication.userId).toBe('user2');
		session.userId = undefined;
		expect(publication.userId).toBeNull();
	});

	it('exposes the session socket, initial user, connection, and bound sendAdded', () => {
		expect(publication.connection).toBe(session.connection);
		expect(publication._session?.socket).toBe(session);
		expect(publication._session?.userId).toBe('user1');
		const sendAdded = publication._session?.sendAdded;
		expect(sendAdded).toBeDefined();

		sendAdded?.('messages', 'message1', { text: 'hello' });

		expect(sentPackets(session)).toEqual([{ msg: 'added', collection: 'messages', id: 'message1', fields: { text: 'hello' } }]);
	});

	it('allows a session without an authenticated user', () => {
		session.userId = undefined;
		const anonymous = new Publication(session, { ...makeSubscription(), id: 'anonymous' });

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

		expect(sentPackets(session)).toEqual([
			{ msg: 'added', collection: 'messages', id: 'message1', fields: { text: 'hello' } },
			{ msg: 'changed', collection: 'messages', id: 'message1', fields: { text: 'updated' } },
			{ msg: 'removed', collection: 'messages', id: 'message1' },
		]);
	});

	it('accepts the error and unblock operations without sending anything', () => {
		expect(() => publication.error(new Error('failure'))).not.toThrow();
		expect(() => publication.unblock()).not.toThrow();
		expect(session.send).not.toHaveBeenCalled();
		expect(session.subscriptions.get('test-id')).toBe(publication);
	});
});
