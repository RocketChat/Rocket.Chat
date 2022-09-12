import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { Presence } from '../sdk';

Meteor.startup(function () {
	const nodeId = InstanceStatus.id();
	Meteor.onConnection(function (connection) {
		const session = Meteor.server.sessions.get(connection.id);

		connection.onClose(function () {
			if (!session) {
				return;
			}

			Presence.removeConnection(session.userId, connection.id, nodeId);
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
	});

	Accounts.onLogout(function (login: any): void {
		Presence.removeConnection(login.user._id, login.connection.id, nodeId);
	});
});
