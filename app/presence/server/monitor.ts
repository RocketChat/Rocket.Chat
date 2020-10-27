import { EventEmitter } from 'events';

import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { UserPresence } from './server';
import UsersSessions from '../../models/server/models/UsersSessions';
import { IUserSession } from '../../../definition/IUserSession';

export const UserPresenceEvents = new EventEmitter();

function monitorDeletedServers(): void {
	InstanceStatus.getCollection().find({}, { fields: { _id: 1 } }).observeChanges({
		removed(id: string) {
			UserPresence.removeConnectionsByInstanceId(id);
		},
	});
}

function removeLostConnections(): void {
	const ids = InstanceStatus.getCollection().find({}, { fields: { _id: 1 } }).fetch().map(function(id: {_id: string}) {
		return id._id;
	});

	const update = {
		$pull: {
			connections: {
				instanceId: {
					$nin: ids,
				},
			},
		},
	};
	UsersSessions.update({}, update, { multi: true });
}

export const UserPresenceMonitor = {
	/**
	 * The callback will receive the following parameters: user, status, statusConnection
	 */
	onSetUserStatus(callback: (...args: any[]) => any): void {
		UserPresenceEvents.on('setUserStatus', callback);
	},

	// following actions/observers will run only when presence monitor turned on
	start(): void {
		UsersSessions.find({}).observe({
			added(record: IUserSession) {
				UserPresenceMonitor.processUserSession(record, 'added');
			},
			changed(record: IUserSession) {
				UserPresenceMonitor.processUserSession(record, 'changed');
			},
			removed(record: IUserSession) {
				UserPresenceMonitor.processUserSession(record, 'removed');
			},
		});

		removeLostConnections();

		monitorDeletedServers();
	},

	processUserSession(record: IUserSession, action: string): void {
		if (action === 'removed' && (record.connections == null || record.connections.length === 0)) {
			return;
		}

		if (record.connections == null || record.connections.length === 0 || action === 'removed') {
			UserPresenceMonitor.setStatus(record._id, 'offline', record.metadata);

			if (action !== 'removed') {
				UsersSessions.remove({ _id: record._id, 'connections.0': { $exists: false } });
			}
			return;
		}

		let connectionStatus = 'offline';
		record.connections.forEach(function(connection) {
			if (connection.status === 'online') {
				connectionStatus = 'online';
			} else if (connection.status === 'away' && connectionStatus === 'offline') {
				connectionStatus = 'away';
			}
		});

		UserPresenceMonitor.setStatus(record._id, connectionStatus, record.metadata);
	},

	processUser(id: string, fields: {statusDefault?: string}): void {
		if (fields.statusDefault == null) {
			return;
		}

		const userSession = UsersSessions.findOne({ _id: id });

		if (userSession) {
			UserPresenceMonitor.processUserSession(userSession, 'changed');
		}
	},

	setStatus(id: string, status: string, metadata?: object): void {
		UserPresenceEvents.emit('setStatus', id, status, metadata);
	},
};
