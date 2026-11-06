import WebSocket from 'ws';

import { Publication } from './Publication';
import { makeSession, makeSubscription, sentPackets } from './__tests__/helpers';

const mockLoggerError = jest.fn();
jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({ error: (...args: unknown[]) => mockLoggerError(...args) })),
}));

describe('Publication', () => {
	let session: ReturnType<typeof makeSession>;
	let publication: Publication;

	beforeEach(() => {
		mockLoggerError.mockClear();
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

	it('reports itself deactivated once the session closes or it stops', () => {
		const other = new Publication(session, { ...makeSubscription(), id: 'other-id' });

		session.emit('close');
		other.stop();

		expect(publication._isDeactivated()).toBe(true);
		expect(publication._session).toBeNull();
		expect(other._isDeactivated()).toBe(true);
		expect(other._session).toBeNull();
	});

	it('runs a stop callback registered after the session closed right away, once', () => {
		const late = jest.fn();
		session.emit('close');

		publication.onStop(late);
		expect(late).toHaveBeenCalledTimes(1);

		publication.stop();
		session.emit('close');
		expect(late).toHaveBeenCalledTimes(1);
	});

	it('runs a stop callback registered after an explicit stop right away', () => {
		const late = jest.fn();
		publication.stop();

		publication.onStop(late);

		expect(late).toHaveBeenCalledTimes(1);
	});

	it('sends a single nosub across repeated stops', () => {
		publication.stop();
		publication.stop();

		expect(sentPackets(session)).toEqual([{ msg: 'nosub', id: 'test-id' }]);
	});

	it('stops without writing to a socket that is no longer open', () => {
		const onStop = jest.fn();
		publication.onStop(onStop);
		session.ws.readyState = WebSocket.CLOSING;

		publication.stop();

		expect(session.send).not.toHaveBeenCalled();
		expect(onStop).toHaveBeenCalledTimes(1);
		expect(session.subscriptions.has('test-id')).toBe(false);
	});

	it('runs every stop callback and is fully stopped when one of them throws', () => {
		const failure = new Error('stop callback failure');
		const after = jest.fn();
		publication.onStop(() => {
			throw failure;
		});
		publication.onStop(after);

		expect(() => publication.stop()).not.toThrow();

		expect(after).toHaveBeenCalledTimes(1);
		expect(mockLoggerError).toHaveBeenCalledWith(expect.objectContaining({ name: 'messages', err: failure }));
		expect(publication._isDeactivated()).toBe(true);
		expect(session.subscriptions.has('test-id')).toBe(false);
		expect(session.listenerCount('close')).toBe(0);
	});

	it('logs a stop callback whose promise rejects and still runs the others', async () => {
		const failure = new Error('async stop callback failure');
		const after = jest.fn();
		publication.onStop(async () => {
			throw failure;
		});
		publication.onStop(after);

		publication.stop();
		await new Promise((resolve) => setImmediate(resolve));

		expect(after).toHaveBeenCalledTimes(1);
		expect(mockLoggerError).toHaveBeenCalledWith(expect.objectContaining({ name: 'messages', err: failure }));
	});

	it('stops every publication of a closing session when a stop callback of one of them throws', () => {
		const other = new Publication(session, { ...makeSubscription(), id: 'other-id' });
		const onOtherStop = jest.fn();
		publication.onStop(() => {
			throw new Error('stop callback failure');
		});
		other.onStop(onOtherStop);

		expect(() => session.emit('close')).not.toThrow();

		expect(onOtherStop).toHaveBeenCalledTimes(1);
		expect(other._isDeactivated()).toBe(true);
		expect(session.subscriptions.size).toBe(0);
	});

	it('logs, instead of throwing, an error from a stop callback registered after the stop', () => {
		publication.stop();

		expect(() =>
			publication.onStop(() => {
				throw new Error('stop callback failure');
			}),
		).not.toThrow();
		expect(mockLoggerError).toHaveBeenCalledTimes(1);
	});

	it('removes its session close listener when stopped', () => {
		expect(session.listenerCount('close')).toBe(1);

		publication.stop();

		expect(session.listenerCount('close')).toBe(0);
	});

	it('does not accumulate session close listeners across subscription churn', () => {
		publication.stop();

		for (let i = 0; i < 51; i++) {
			new Publication(session, { ...makeSubscription(), id: `sub-${i}` }).stop();
		}

		expect(session.listenerCount('close')).toBe(0);
		expect(session.subscriptions.size).toBe(0);
	});

	it('keeps stopping the remaining publications on disconnect after one of them stops', () => {
		const other = new Publication(session, { ...makeSubscription(), id: 'other-id' });
		const onOtherStop = jest.fn();
		other.onStop(onOtherStop);

		publication.stop();
		session.emit('close');

		expect(onOtherStop).toHaveBeenCalledTimes(1);
		expect(session.subscriptions.size).toBe(0);
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
