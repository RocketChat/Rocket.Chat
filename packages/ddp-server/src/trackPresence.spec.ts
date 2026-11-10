import { Presence } from '@rocket.chat/core-services';

import { makeSession } from './__tests__/helpers';
import { ConnectionLifecycle } from './lifecycle';
import { trackPresence } from './trackPresence';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Presence: {
		newConnection: jest.fn().mockResolvedValue(undefined),
		removeConnection: jest.fn().mockResolvedValue(undefined),
		updateConnection: jest.fn().mockResolvedValue(undefined),
	},
}));

describe('trackPresence', () => {
	let lifecycle: ConnectionLifecycle;

	beforeEach(() => {
		jest.clearAllMocks();
		lifecycle = new ConnectionLifecycle();
		trackPresence(lifecycle, 'node1');
	});

	it('adds the connection of a session that logs in', () => {
		lifecycle.emit('loggedIn', makeSession());

		expect(Presence.newConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');
	});

	it('refreshes the connection of a logged-in session on activity', () => {
		lifecycle.emit('activity', makeSession());

		expect(Presence.updateConnection).toHaveBeenCalledWith('user1', 'connection1');
	});

	it.each(['loggedOut', 'disconnected'] as const)('removes the connection of a logged-in session once %s', (event) => {
		lifecycle.emit(event, makeSession());

		expect(Presence.removeConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');
	});

	it.each(['loggedIn', 'activity', 'loggedOut', 'disconnected'] as const)('ignores an anonymous session on %s', (event) => {
		const session = makeSession();
		session.userId = undefined;

		lifecycle.emit(event, session);

		expect(Presence.newConnection).not.toHaveBeenCalled();
		expect(Presence.updateConnection).not.toHaveBeenCalled();
		expect(Presence.removeConnection).not.toHaveBeenCalled();
	});
});
