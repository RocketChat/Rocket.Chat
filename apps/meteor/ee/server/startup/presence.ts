import { Presence } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { throttle } from 'underscore';

const lastWrite = new Map<string, number>();

// throttle presence updates to avoid excessive writes
const updateConnectionStatus = (userId: string, connectionId: string) => {
	const key = `${userId}-${connectionId}`;
	const now = Date.now();
	const last = lastWrite.get(key) || 0;

	if (now - last > 60000) {
		lastWrite.set(key, now);
		return Presence.setConnectionStatus(userId, connectionId);
	}

	return Promise.resolve();
};

// update connections count every 30 seconds
const updateConns = throttle(function _updateConns() {
	void InstanceStatus.updateConnections(Meteor.server.sessions.size);
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

	Accounts.onLogin((login: { connection: { id: string }; user: { _id: string } }): void => {
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
			void updateConnectionStatus(login.user._id, login.connection.id);
			return _messageReceived();
		};

		void (async function () {
			await Presence.newConnection(login.user._id, login.connection.id, nodeId);
			updateConns();
		})();
	});

	Accounts.onLogout((login): void => {
		void Presence.removeConnection(login.user?._id, login.connection.id, nodeId);

		updateConns();
	});
});
