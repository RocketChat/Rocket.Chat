import { Meteor } from 'meteor/meteor';
import { UserPresence } from 'meteor/konecty:user-presence';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { check } from 'meteor/check';
import { DDP } from 'meteor/ddp';

import { Logger, LoggerManager } from '../../app/logger';
import { hasPermission } from '../../app/authorization';
import { settings } from '../../app/settings';
import { isDocker, getURL } from '../../app/utils';
import { Users } from '../../app/models/server';
import InstanceStatusModel from '../../app/models/server/models/InstanceStatus';
import { StreamerCentral } from '../modules/streamer/streamer.module';

process.env.PORT = String(process.env.PORT).trim();
process.env.INSTANCE_IP = String(process.env.INSTANCE_IP).trim();

const startMonitor = typeof process.env.DISABLE_PRESENCE_MONITOR === 'undefined'
	|| !['true', 'yes'].includes(String(process.env.DISABLE_PRESENCE_MONITOR).toLowerCase());

const connections = {};
this.connections = connections;

const logger = new Logger('StreamBroadcast', {
	sections: {
		connection: 'Connection',
		auth: 'Auth',
		stream: 'Stream',
	},
});

function _authorizeConnection(instance) {
	logger.auth.info(`Authorizing with ${ instance }`);

	return connections[instance].call('broadcastAuth', InstanceStatus.id(), connections[instance].instanceId, function(err, ok) {
		if (err != null) {
			return logger.auth.error(`broadcastAuth error ${ instance } ${ InstanceStatus.id() } ${ connections[instance].instanceId }`, err);
		}

		connections[instance].broadcastAuth = ok;
		return logger.auth.info(`broadcastAuth with ${ instance }`, ok);
	});
}

function authorizeConnection(instance) {
	const query = {
		_id: InstanceStatus.id(),
	};

	if (!InstanceStatus.getCollection().findOne(query)) {
		return Meteor.setTimeout(function() {
			return authorizeConnection(instance);
		}, 500);
	}

	return _authorizeConnection(instance);
}

const cache = new Map();
const originalSetDefaultStatus = UserPresence.setDefaultStatus;
export let matrixBroadCastActions;
function startMatrixBroadcast() {
	if (!startMonitor) {
		UserPresence.setDefaultStatus = originalSetDefaultStatus;
	}

	matrixBroadCastActions = {
		added(record) {
			cache.set(record._id, record);

			const subPath = getURL('', { cdn: false, full: false });
			let instance = `${ record.extraInformation.host }:${ record.extraInformation.port }${ subPath }`;

			if (record.extraInformation.port === process.env.PORT && record.extraInformation.host === process.env.INSTANCE_IP) {
				logger.auth.info('prevent self connect', instance);
				return;
			}

			if (record.extraInformation.host === process.env.INSTANCE_IP && isDocker() === false) {
				instance = `localhost:${ record.extraInformation.port }${ subPath }`;
			}

			if (connections[instance] && connections[instance].instanceRecord) {
				if (connections[instance].instanceRecord._createdAt < record._createdAt) {
					connections[instance].disconnect();
					delete connections[instance];
				} else {
					return;
				}
			}

			logger.connection.info('connecting in', instance);

			connections[instance] = DDP.connect(instance, {
				_dontPrintErrors: LoggerManager.logLevel < 2,
			});

			// remove not relevant info from instance record
			delete record.extraInformation.os;

			connections[instance].instanceRecord = record;
			connections[instance].instanceId = record._id;

			connections[instance].onReconnect = function() {
				return authorizeConnection(instance);
			};
		},

		removed(id) {
			const record = cache.get(id);
			if (!record) {
				return;
			}
			cache.delete(id);

			const subPath = getURL('', { cdn: false, full: false });
			let instance = `${ record.extraInformation.host }:${ record.extraInformation.port }${ subPath }`;

			if (record.extraInformation.host === process.env.INSTANCE_IP && isDocker() === false) {
				instance = `localhost:${ record.extraInformation.port }${ subPath }`;
			}

			const query = {
				'extraInformation.host': record.extraInformation.host,
				'extraInformation.port': record.extraInformation.port,
			};

			if (connections[instance] && !InstanceStatus.getCollection().findOne(query)) {
				logger.connection.info('disconnecting from', instance);
				connections[instance].disconnect();
				return delete connections[instance];
			}
		},
	};

	const query = {
		'extraInformation.port': {
			$exists: true,
		},
	};

	const options = {
		sort: {
			_createdAt: -1,
		},
	};

	InstanceStatusModel.find(query, options).fetch().forEach(matrixBroadCastActions.added);
}


function startStreamCastBroadcast(value) {
	const instance = 'StreamCast';

	logger.connection.info('connecting in', instance, value);

	if (!startMonitor) {
		UserPresence.setDefaultStatus = (id, status) => {
			Users.updateDefaultStatus(id, status);
		};
	}

	const connection = DDP.connect(value, {
		_dontPrintErrors: LoggerManager.logLevel < 2,
	});

	connections[instance] = connection;
	connection.instanceId = instance;
	connection.instanceRecord = {};
	connection.onReconnect = function() {
		return authorizeConnection(instance);
	};

	connection.registerStore('broadcast-stream', {
		update({ fields }) {
			const { streamName, eventName, args } = fields;

			if (!streamName || !eventName || !args) {
				return;
			}

			if (connection.broadcastAuth !== true) {
				return 'not-authorized';
			}

			const instance = StreamerCentral.instances[streamName];
			if (!instance) {
				return 'stream-not-exists';
			}

			if (instance.serverOnly) {
				return instance.__emit(eventName, ...args);
			}
			return instance._emit(eventName, args);
		},
	});

	return connection.subscribe('stream');
}

export function startStreamBroadcast() {
	if (!process.env.INSTANCE_IP) {
		process.env.INSTANCE_IP = 'localhost';
	}

	logger.info('startStreamBroadcast');

	settings.get('Stream_Cast_Address', function(key, value) {
		// var connection, fn, instance;
		const fn = function(instance, connection) {
			connection.disconnect();
			return delete connections[instance];
		};

		for (const instance of Object.keys(connections)) {
			const connection = connections[instance];
			fn(instance, connection);
		}

		if (value && value.trim() !== '') {
			return startStreamCastBroadcast(value);
		}
		return startMatrixBroadcast();
	});

	function broadcast(streamName, eventName, args/* , userId*/) {
		const fromInstance = `${ process.env.INSTANCE_IP }:${ process.env.PORT }`;
		const results = [];

		for (const instance of Object.keys(connections)) {
			const connection = connections[instance];

			if (connection.status().connected === true) {
				connection.call('stream', streamName, eventName, args, function(error, response) {
					if (error) {
						logger.error('Stream broadcast error', error);
					}

					switch (response) {
						case 'self-not-authorized':
							logger.stream.error(`Stream broadcast from '${ fromInstance }' to '${ connection._stream.endpoint }' with name ${ streamName } to self is not authorized`.red);
							logger.stream.debug('    -> connection authorized'.red, connection.broadcastAuth);
							logger.stream.debug('    -> connection status'.red, connection.status());
							return logger.stream.debug('    -> arguments'.red, eventName, args);
						case 'not-authorized':
							logger.stream.error(`Stream broadcast from '${ fromInstance }' to '${ connection._stream.endpoint }' with name ${ streamName } not authorized`.red);
							logger.stream.debug('    -> connection authorized'.red, connection.broadcastAuth);
							logger.stream.debug('    -> connection status'.red, connection.status());
							logger.stream.debug('    -> arguments'.red, eventName, args);
							return authorizeConnection(instance);
						case 'stream-not-exists':
							logger.stream.error(`Stream broadcast from '${ fromInstance }' to '${ connection._stream.endpoint }' with name ${ streamName } does not exist`.red);
							logger.stream.debug('    -> connection authorized'.red, connection.broadcastAuth);
							logger.stream.debug('    -> connection status'.red, connection.status());
							return logger.stream.debug('    -> arguments'.red, eventName, args);
					}
				});
			}
		}
		return results;
	}

	const onBroadcast = Meteor.bindEnvironment(broadcast);

	let TroubleshootDisableInstanceBroadcast;
	settings.get('Troubleshoot_Disable_Instance_Broadcast', (key, value) => {
		if (TroubleshootDisableInstanceBroadcast === value) { return; }
		TroubleshootDisableInstanceBroadcast = value;

		if (value) {
			return StreamerCentral.removeListener('broadcast', onBroadcast);
		}

		StreamerCentral.on('broadcast', onBroadcast);
	});
}

function getConnection(address) {
	const conn = connections[address];
	if (!conn) {
		return;
	}

	const {
		instanceRecord,
		broadcastAuth,
	} = conn;

	return {
		address,
		currentStatus: conn._stream.currentStatus,
		instanceRecord,
		broadcastAuth,
	};
}

export function getInstanceConnection(instance) {
	const subPath = getURL('', { cdn: false, full: false });
	const address = `${ instance.extraInformation.host }:${ instance.extraInformation.port }${ subPath }`;

	return getConnection(address);
}

Meteor.methods({
	broadcastAuth(remoteId, selfId) {
		check(selfId, String);
		check(remoteId, String);

		const query = {
			_id: remoteId,
		};

		if (selfId === InstanceStatus.id() && remoteId !== InstanceStatus.id() && InstanceStatus.getCollection().findOne(query)) {
			this.connection.broadcastAuth = true;
		}

		return this.connection.broadcastAuth === true;
	},

	stream(streamName, eventName, args) {
		if (!this.connection) {
			return 'self-not-authorized';
		}

		if (this.connection.broadcastAuth !== true) {
			return 'not-authorized';
		}

		const instance = StreamerCentral.instances[streamName];
		if (!instance) {
			return 'stream-not-exists';
		}

		if (instance.serverOnly) {
			instance.__emit(eventName, ...args);
		} else {
			StreamerCentral.instances[streamName]._emit(eventName, args);
		}
	},

	'instances/get'() {
		if (!hasPermission(Meteor.userId(), 'view-statistics')) {
			throw new Meteor.Error('error-action-not-allowed', 'List instances is not allowed', {
				method: 'instances/get',
			});
		}
		return Object.keys(connections).map(getConnection);
	},
});
