import { throttle } from 'underscore';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Presence } from '@rocket.chat/core-services';

// update connections count every 30 seconds
const updateConns = throttle(function _updateConns() {
	void InstanceStatus.updateConnections(Meteor.server.sessions.size);
}, 30000);

Meteor.startup(function () {
	const nodeId = InstanceStatus.id();

	Meteor.onConnection(function (connection) {
		const session = Meteor.server.sessions.get(connection.id);

		connection.onClose(async function () {
			if (!session) {
				return;
			}

			await Presence.removeConnection(session.userId, connection.id, nodeId);
			updateConns();
		});
	});

	process.on('exit', async function () {
		await Presence.removeLostConnections(nodeId);
	});

	Accounts.onLogin(function (login: any): void {
		if (login.type !== 'resume') {
			return;
		}
		void Presence.newConnection(login.user._id, login.connection.id, nodeId).then(() => {
			updateConns();
		});
	});

	Accounts.onLogout(function (login: any): void {
		void Presence.removeConnection(login.user._id, login.connection.id, nodeId);

		updateConns();
	});
});
