import { Presence } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { throttle } from 'underscore';

import { lifecycle, sessions } from '../../../server/lib/realtime/sessions';

// update connections count every 30 seconds
const updateConns = throttle(function _updateConns() {
	void InstanceStatus.updateConnections(sessions.size);
}, 30000);

Meteor.startup(() => {
	const nodeId = InstanceStatus.id();

	process.on('exit', async () => {
		await Presence.removeLostConnections(nodeId);
	});

	lifecycle.on('loggedIn', ({ userId, connection }) => {
		if (!userId) {
			return;
		}
		void Presence.newConnection(userId, connection.id, nodeId).then(updateConns);
	});

	lifecycle.on('activity', ({ userId, connection }) => {
		if (!userId) {
			return;
		}
		void Presence.updateConnection(userId, connection.id).catch((err) => {
			console.error('Error updating connection presence:', err);
		});
	});

	lifecycle.on('disconnected', ({ userId, connection }) => {
		updateConns();
		if (!userId) {
			return;
		}
		void Presence.removeConnection(userId, connection.id, nodeId);
	});

	Accounts.onLogout((login): void => {
		void Presence.removeConnection(login.user?._id, login.connection.id, nodeId);

		updateConns();
	});
});
