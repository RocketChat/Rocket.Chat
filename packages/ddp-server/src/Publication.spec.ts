import { Streamer } from '@rocket.chat/streamer';

import { Publication } from './Publication';
import { makeSession, makeSubscription, sentPackets } from './__tests__/helpers';

// The streamer is abstract; this spec only needs _publish and the activity check.
class TestStreamer extends Streamer<any> {
	registerPublication(): void {
		// publication registration belongs to the transport, not to this spec
	}

	registerMethod(): void {
		// method dispatch is not exercised here
	}

	changedPayload(): string {
		return 'payload';
	}
}

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

	it('retires the publication when the session closes, so a later continuation cannot revive it', () => {
		session.emit('close');

		expect(publication._isDeactivated()).toBe(true);
		expect(publication._session).toBeNull();
	});

	it('runs a cleanup registered after the publication already stopped', () => {
		const cleanup = jest.fn();

		session.emit('close');
		publication.onStop(cleanup);

		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('runs a cleanup registered after an explicit stop, and only once', () => {
		const cleanup = jest.fn();

		publication.stop();
		publication.onStop(cleanup);
		session.emit('close');

		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('stops once no matter how many times stop is called', () => {
		publication.stop();
		publication.stop();
		publication.stop();

		expect(sentPackets(session)).toEqual([{ msg: 'nosub', id: 'test-id' }]);
	});

	it('lets the streamer remove a listener registered before a mid-await disconnect', () => {
		const listeners = new Set(['room1']);

		session.emit('close');
		publication.onStop(() => listeners.delete('room1'));

		expect(listeners.size).toBe(0);
	});

	it('deactivates a publication whose session closed, so a late continuation cannot revive it', async () => {
		// Streamer._publish re-checks _isDeactivated() after every await; a continuation
		// that resumes once the client has gone must not attach anything.
		const continuation = Promise.resolve().then(() => (publication._isDeactivated() ? 'aborted' : 'attached'));

		session.emit('close');

		await expect(continuation).resolves.toBe('aborted');
	});

	it('does not attach a listener when the client disconnects during a publish', async () => {
		const streamer = new TestStreamer('disconnect-race');
		streamer.allowRead('all');

		let resumeLookup: () => void = () => undefined;
		const lookup = new Promise<void>((resolve) => {
			resumeLookup = resolve;
		});

		const attached: string[] = [];
		streamer.on('_afterPublish', async (_streamer, published) => {
			await lookup; // the awaited database lookup the notification module does

			if (!Streamer.isPublicationActive(published)) {
				return;
			}

			attached.push('room1');
			published.onStop(() => {
				attached.pop();
			});
		});

		await streamer._publish(publication, 'rooms-changed', false);

		session.emit('close'); // the client disconnects while the lookup is in flight
		resumeLookup();
		await lookup;

		expect(attached).toEqual([]);
		expect(streamer.subscriptions.size).toBe(0);
	});
});
