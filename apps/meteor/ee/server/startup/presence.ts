import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Presence } from '@rocket.chat/core-services';

// TODO add throttle
const updateConns = function () {
	InstanceStatus.updateConnections(Meteor.server.sessions.size);
};

Meteor.startup(function () {
	const nodeId = InstanceStatus.id();

	Meteor.onConnection(function (connection) {
		const session = Meteor.server.sessions.get(connection.id);

		connection.onClose(function () {
			if (!session) {
				return;
			}

			Presence.removeConnection(session.userId, connection.id, nodeId);
			updateConns();
		});
	});

	process.on('exit', function () {
		Presence.removeLostConnections(nodeId);
	});

	Accounts.onLogin(function (login: any): void {
		if (login.type !== 'resume') {
			return;
		}
		Presence.newConnection(login.user._id, login.connection.id, nodeId);

		updateConns();
	});

	Accounts.onLogout(function (login: any): void {
		Presence.removeConnection(login.user._id, login.connection.id, nodeId);

		updateConns();
	});
});
