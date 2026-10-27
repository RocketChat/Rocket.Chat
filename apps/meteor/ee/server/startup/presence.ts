import { Presence } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { throttle } from 'underscore';

import { lifecycle, sessions } from '../../../server/lib/realtime/sessions';

// update connections count every 30 seconds
const updateConns = throttle(function _updateConns() {
	void InstanceStatus.updateConnections(Meteor.server.sessions.size + sessions.size);
}, 30000);

Meteor.startup(() => {
	const nodeId = InstanceStatus.id();

	Meteor.onConnection((connection) => {
		const session = Meteor.server.sessions.get(connection.id);

		connection.onClose(async () => {
			if (!session) {
				return;
			}

			await Presence.removeConnection(session.userId, connection.id, nodeId);
			updateConns();
		});
	});

	process.on('exit', async () => {
		await Presence.removeLostConnections(nodeId);
	});

	Accounts.onLogin((login: any): void => {
		if (!login.connection.id) {
			return;
		}

		// validate if it is a real WS connection and is still open
		const session = Meteor.server.sessions.get(login.connection.id);
		if (!session) {
			return;
		}

		const _messageReceived = session.heartbeat.messageReceived.bind(session.heartbeat);
		session.heartbeat.messageReceived = function messageReceived() {
			if (this._seenPacket === false) {
				void Presence.updateConnection(login.user._id, login.connection.id).catch((err) => {
					console.error('Error updating connection presence on heartbeat:', err);
				});
			}
			return _messageReceived();
		};

		void (async function () {
			await Presence.newConnection(login.user._id, login.connection.id, nodeId);
			updateConns();
		})();
	});

	// the sessions of our own DDP server, which Meteor's session map and heartbeat know nothing about
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
