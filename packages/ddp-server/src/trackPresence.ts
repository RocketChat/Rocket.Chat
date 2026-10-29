import { Presence } from '@rocket.chat/core-services';

import type { Session } from './Session';
import type { ConnectionLifecycle } from './lifecycle';

/**
 * Keeps Presence in step with the logged-in sessions of node `nodeId`: a session's connection is added on login,
 * refreshed on activity, and removed on logout or disconnection.
 */
export const trackPresence = (lifecycle: ConnectionLifecycle, nodeId: string): void => {
	const removeConnection = ({ userId, connection }: Session): void => {
		if (!userId) {
			return;
		}
		void Presence.removeConnection(userId, connection.id, nodeId);
	};

	lifecycle.on('loggedIn', ({ userId, connection }) => {
		if (!userId) {
			return;
		}
		void Presence.newConnection(userId, connection.id, nodeId);
	});

	lifecycle.on('activity', ({ userId, connection }) => {
		if (!userId) {
			return;
		}
		void Presence.updateConnection(userId, connection.id).catch((err) => {
			console.error('Error updating connection presence:', err);
		});
	});

	lifecycle.on('loggedOut', removeConnection);
	lifecycle.on('disconnected', removeConnection);
};
