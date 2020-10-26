import 'colors';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { check, Match } from 'meteor/check';

import { UserPresenceEvents, UserPresenceMonitor } from './monitor';
import UsersSessions from '../../models/server/models/UsersSessions';
import Users from '../../models/server/models/Users';

const allowedStatus = ['online', 'away', 'busy', 'offline'];

let logEnable = process.env.ENABLE_PRESENCE_LOGS === 'true';

const log = function(msg: string, color: 'red' | 'grey' | 'green' | 'yellow'): void {
	if (logEnable) {
		if (color) {
			console.log(msg[color]);
		} else {
			console.log(msg);
		}
	}
};

const logRed = (...args: any[]): void => log(args.join(' '), 'red');
const logGrey = (...args: any[]): void => log(args.join(' '), 'grey');
const logGreen = (...args: any[]): void => log(args.join(' '), 'green');
const logYellow = (...args: any[]): void => log(args.join(' '), 'yellow');

const checkUser = function(id?: string | null, userId?: string | null): boolean {
	if (!id || !userId || id === userId) {
		return true;
	}
	const user = Users.findOne(id, { fields: { _id: 1 } });
	if (user) {
		throw new Meteor.Error('cannot-change-other-users-status');
	}

	return true;
};

// type Connection = {
// 	id: string;
// 	metadata?: Record<string, any>;
// 	onClose(callback: (...args: any[]) => void): void;
// }

export const UserPresence = {
	activeLogs(): void {
		logEnable = true;
	},

	removeConnectionsByInstanceId(instanceId: string): void {
		logRed('[user-presence] removeConnectionsByInstanceId', instanceId);
		const update = {
			$pull: {
				connections: {
					instanceId,
				},
			},
		};

		UsersSessions.update({}, update, { multi: true });
	},

	removeAllConnections(): void {
		logRed('[user-presence] removeAllConnections');
		UsersSessions.remove({});
	},

	getConnectionHandle(connectionId: string): any {
		const internalConnection = Meteor.server.sessions.get(connectionId);

		if (!internalConnection) {
			return;
		}

		return internalConnection.connectionHandle;
	},

	createConnection(userId: string | undefined | null, connection: Meteor.Connection, status?: string, metadata?: object | null): void {
		// if connections is invalid, does not have an userId or is already closed, don't save it on db
		if (!userId || !connection.id) {
			return;
		}

		const connectionHandle = UserPresence.getConnectionHandle(connection.id);

		if (!connectionHandle || connectionHandle.closed) {
			return;
		}

		connectionHandle.UserPresenceUserId = userId;

		status = status || 'online';

		logGreen('[user-presence] createConnection', userId, connection.id, status, metadata);

		const query = {
			_id: userId,
		};

		const now = new Date();

		let instanceId = undefined;
		// if (Package['konecty:multiple-instances-status']) {
		instanceId = InstanceStatus.id();
		// }

		const update: {
			$push: any;
			$set?: any;
		} = {
			$push: {
				connections: {
					id: connection.id,
					instanceId,
					status,
					_createdAt: now,
					_updatedAt: now,
				},
			},
		};

		if (metadata) {
			update.$set = {
				metadata,
			};
			connection.metadata = metadata;
		}

		// make sure closed connections are being created
		if (!connectionHandle.closed) {
			UsersSessions.upsert(query, update);
		}
	},

	setConnection(userId: string | undefined | null, connection: Meteor.Connection, status: string): void {
		if (!userId) {
			return;
		}

		logGrey('[user-presence] setConnection', userId, connection.id, status);

		const query = {
			_id: userId,
			'connections.id': connection.id,
		};

		const now = new Date();

		const update: {$set: any} = {
			$set: {
				'connections.$.status': status,
				'connections.$._updatedAt': now,
			},
		};

		if (connection.metadata) {
			update.$set.metadata = connection.metadata;
		}

		const count = UsersSessions.update(query, update);

		if (count === 0) {
			return UserPresence.createConnection(userId, connection, status, connection.metadata);
		}

		if (status === 'online') {
			Users.update({ _id: userId, statusDefault: 'online', status: { $ne: 'online' } }, { $set: { status: 'online' } });
		} else if (status === 'away') {
			Users.update({ _id: userId, statusDefault: 'online', status: { $ne: 'away' } }, { $set: { status: 'away' } });
		}
	},

	setDefaultStatus(userId: string | undefined | null, status: string): void {
		if (!userId) {
			return;
		}

		if (allowedStatus.indexOf(status) === -1) {
			return;
		}

		logYellow('[user-presence] setDefaultStatus', userId, status);

		const update = Users.update({ _id: userId, statusDefault: { $ne: status } }, { $set: { statusDefault: status } });

		if (update > 0) {
			UserPresenceMonitor.processUser(userId, { statusDefault: status });
		}
	},

	removeConnection(connectionId: string): void {
		logRed('[user-presence] removeConnection', connectionId);

		const query = {
			'connections.id': connectionId,
		};

		const update = {
			$pull: {
				connections: {
					id: connectionId,
				},
			},
		};

		return UsersSessions.update(query, update);
	},

	start(): void {
		Meteor.onConnection(function(connection: Meteor.Connection) {
			const session = Meteor.server.sessions.get(connection.id);

			connection.onClose(function() {
				if (!session) {
					return;
				}

				const { connectionHandle } = session;

				// mark connection as closed so if it drops in the middle of the process it doesn't even is created
				if (!connectionHandle) {
					return;
				}
				connectionHandle.closed = true;

				if (connectionHandle.UserPresenceUserId != null) {
					UserPresence.removeConnection(connection.id);
				}
			});
		});

		process.on('exit', Meteor.bindEnvironment(function() {
			// if (Package['konecty:multiple-instances-status']) {
			UserPresence.removeConnectionsByInstanceId(InstanceStatus.id());
			// } else {
			// 	UserPresence.removeAllConnections();
			// }
		}));

		// if (Package['accounts-base']) {
		Accounts.onLogin(function(login) {
			UserPresence.createConnection(login.user._id, login.connection);
		});

		Accounts.onLogout(function(login) {
			UserPresence.removeConnection(login.connection.id);
		});
		// }

		Meteor.publish(null, function() {
			if (this.userId == null && this.connection && this.connection.id) {
				const connectionHandle = UserPresence.getConnectionHandle(this.connection.id);
				if (connectionHandle && connectionHandle.UserPresenceUserId != null) {
					UserPresence.removeConnection(this.connection.id);
				}
			}

			this.ready();
		});

		UserPresenceEvents.on('setStatus', function(userId, status) {
			const user = Users.findOne(userId);
			const statusConnection = status;

			if (!user) {
				return;
			}

			if (user.statusDefault != null && status !== 'offline' && user.statusDefault !== 'online') {
				status = user.statusDefault;
			}

			const query = {
				_id: userId,
				$or: [
					{ status: { $ne: status } },
					{ statusConnection: { $ne: statusConnection } },
				],
			};

			const update = {
				$set: {
					status,
					statusConnection,
				},
			};

			const result = Users.update(query, update);

			// if nothing updated, do not emit anything
			if (result) {
				UserPresenceEvents.emit('setUserStatus', user, status, statusConnection);
			}
		});

		Meteor.methods({
			'UserPresence:connect'(id, metadata) {
				check(id, Match.Maybe(String));
				check(metadata, Match.Maybe(Object));
				this.unblock();
				checkUser(id, this.userId);
				if (!this.connection) {
					return;
				}
				UserPresence.createConnection(id || this.userId, this.connection, 'online', metadata);
			},

			'UserPresence:away'(id) {
				check(id, Match.Maybe(String));
				this.unblock();
				checkUser(id, this.userId);
				if (!this.connection) {
					return;
				}
				UserPresence.setConnection(id || this.userId, this.connection, 'away');
			},

			'UserPresence:online'(id) {
				check(id, Match.Maybe(String));
				this.unblock();
				checkUser(id, this.userId);
				if (!this.connection) {
					return;
				}
				UserPresence.setConnection(id || this.userId, this.connection, 'online');
			},

			'UserPresence:setDefaultStatus'(id: string, status: string) {
				check(id, Match.Maybe(String));
				check(status, Match.Maybe(String));
				this.unblock();

				// backward compatible (receives status as first argument)
				if (arguments.length === 1 && this.userId) {
					UserPresence.setDefaultStatus(this.userId, id);
					return;
				}
				checkUser(id, this.userId);
				UserPresence.setDefaultStatus(id || this.userId, status);
			},
		});
	},
};
