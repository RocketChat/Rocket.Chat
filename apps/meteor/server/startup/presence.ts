import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { InstanceStatus as InstanceStatusModel, UsersSessions } from '@rocket.chat/models';

import { isPresenceMonitorEnabled } from '../lib/isPresenceMonitorEnabled';
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
		Presence.newConnection(login.user._id, login.connection.id, nodeId);
	});

	Accounts.onLogout(function (login: any): void {
		Presence.removeConnection(login.user._id, login.connection.id, nodeId);
	});

	// Meteor.publish(null, function () {
	// 	if (this.userId == null && this.connection && this.connection.id) {
	// 		const connectionHandle = UserPresence.getConnectionHandle(this.connection.id);
	// 		if (connectionHandle?.UserPresenceUserId != null) {
	// 			UserPresence.removeConnection(this.connection.id);
	// 		}
	// 	}

	// 	this.ready();
	// });

	if (!isPresenceMonitorEnabled()) {
		return;
	}

	// Remove lost connections
	const ids = Promise.await(InstanceStatusModel.find({}, { projection: { _id: 1 } }).toArray()).map((id) => id._id);

	Promise.await(UsersSessions.clearConnectionsFromInstanceId(ids));
});
