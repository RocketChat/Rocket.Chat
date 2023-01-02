import debounce from 'lodash.debounce';
import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { check } from 'meteor/check';
import { DDP } from 'meteor/ddp';
import { InstanceStatus as InstanceStatusRaw } from '@rocket.chat/models';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Logger } from '../lib/logger/Logger';
import { hasPermission } from '../../app/authorization/server';
import { settings } from '../../app/settings/server';
import { isDocker, getURL } from '../../app/utils/server';
import { StreamerCentral } from '../modules/streamer/streamer.module';
import { isEnterprise } from '../../ee/app/license/server/license';

process.env.PORT = String(process.env.PORT).trim();
process.env.INSTANCE_IP = String(process.env.INSTANCE_IP).trim();

const connections = {};
this.connections = connections;

const logger = new Logger('StreamBroadcast');

export const connLogger = logger.section('Connection');
export const authLogger = logger.section('Auth');
export const streamLogger = logger.section('Stream');

// show warning debounced, giving an extra time for a license to be fetched
const showMonolithWarning = debounce(function () {
	if (!isEnterprise()) {
		logger.warn(TAPi18n.__('Multiple_monolith_instances_alert'));
	}
}, 10000);

function _authorizeConnection(instance) {
	authLogger.info(`Authorizing with ${instance}`);

	return connections[instance].call('broadcastAuth', InstanceStatus.id(), connections[instance].instanceId, function (err, ok) {
		if (err != null) {
			return authLogger.error({
				msg: `broadcastAuth error ${instance} ${InstanceStatus.id()} ${connections[instance].instanceId}`,
				err,
			});
		}

		connections[instance].broadcastAuth = ok;
		return authLogger.info({ msg: `broadcastAuth with ${instance}`, ok });
	});
}

function authorizeConnection(instance) {
	const query = {
		_id: InstanceStatus.id(),
	};

	if (!InstanceStatus.getCollection().findOne(query)) {
		return Meteor.setTimeout(function () {
			return authorizeConnection(instance);
		}, 500);
	}

	return _authorizeConnection(instance);
}

const cache = new Map();
export let matrixBroadCastActions;
function startMatrixBroadcast() {
	matrixBroadCastActions = {
		added: Meteor.bindEnvironment((record) => {
			cache.set(record._id, record);

			const subPath = getURL('', { cdn: false, full: false });
			let instance = `${record.extraInformation.host}:${record.extraInformation.port}${subPath}`;

			if (record.extraInformation.port === process.env.PORT && record.extraInformation.host === process.env.INSTANCE_IP) {
				authLogger.info({ msg: 'prevent self connect', instance });
				return;
			}

			if (record.extraInformation.host === process.env.INSTANCE_IP && isDocker() === false) {
				instance = `localhost:${record.extraInformation.port}${subPath}`;
			}

			if (connections[instance] && connections[instance].instanceRecord) {
				if (connections[instance].instanceRecord._createdAt < record._createdAt) {
					connections[instance].disconnect();
					delete connections[instance];
				} else {
					return;
				}
			}

			connLogger.info({ msg: 'connecting in', instance });

			connections[instance] = DDP.connect(instance, {
				_dontPrintErrors: settings.get('Log_Level') !== '2',
			});

			// remove not relevant info from instance record
			delete record.extraInformation.os;

			connections[instance].instanceRecord = record;
			connections[instance].instanceId = record._id;

			connections[instance].onReconnect = function () {
				return authorizeConnection(instance);
			};

			if (cache.size > 1) {
				showMonolithWarning();
			}
		}),

		removed(id) {
			const record = cache.get(id);
			if (!record) {
				return;
			}
			cache.delete(id);

			const subPath = getURL('', { cdn: false, full: false });
			let instance = `${record.extraInformation.host}:${record.extraInformation.port}${subPath}`;

			if (record.extraInformation.host === process.env.INSTANCE_IP && isDocker() === false) {
				instance = `localhost:${record.extraInformation.port}${subPath}`;
			}

			const query = {
				'extraInformation.host': record.extraInformation.host,
				'extraInformation.port': record.extraInformation.port,
			};

			if (connections[instance] && !InstanceStatus.getCollection().findOne(query)) {
				connLogger.info({ msg: 'disconnecting from', instance });
				connections[instance].disconnect();
				return delete connections[instance];
			}
		},
	};

	InstanceStatusRaw.find(
		{
			'extraInformation.port': {
				$exists: true,
			},
		},
		{
			sort: {
				_createdAt: -1,
			},
		},
	).forEach(matrixBroadCastActions.added);
}

function startStreamCastBroadcast(value) {
	const instance = 'StreamCast';

	connLogger.info({ msg: 'connecting in', instance, value });

	const connection = DDP.connect(value, {
		_dontPrintErrors: settings.get('Log_Level') !== '2',
	});

	connections[instance] = connection;
	connection.instanceId = instance;
	connection.instanceRecord = {};
	connection.onReconnect = function () {
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

	settings.watch('Stream_Cast_Address', function (value) {
		// var connection, fn, instance;
		const fn = function (instance, connection) {
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

	function broadcast(streamName, eventName, args /* , userId*/) {
		const fromInstance = `${process.env.INSTANCE_IP}:${process.env.PORT}`;
		const results = [];

		for (const instance of Object.keys(connections)) {
			const connection = connections[instance];

			if (connection.status().connected === true) {
				connection.call('stream', streamName, eventName, args, function (error, response) {
					if (error) {
						logger.error({ msg: 'Stream broadcast error', err: error });
					}

					switch (response) {
						case 'self-not-authorized':
							streamLogger.error(
								`Stream broadcast from '${fromInstance}' to '${connection._stream.endpoint}' with name ${streamName} to self is not authorized`,
							);
							streamLogger.debug({
								msg: 'self-not-authorized',
								broadcastAuth: connection.broadcastAuth,
								status: connection.status(),
								eventName,
								args,
							});
							return;
						case 'not-authorized':
							streamLogger.error(
								`Stream broadcast from '${fromInstance}' to '${connection._stream.endpoint}' with name ${streamName} not authorized`,
							);
							streamLogger.debug({
								msg: 'not-authorized',
								broadcastAuth: connection.broadcastAuth,
								status: connection.status(),
								eventName,
								args,
							});
							return authorizeConnection(instance);
						case 'stream-not-exists':
							streamLogger.error(
								`Stream broadcast from '${fromInstance}' to '${connection._stream.endpoint}' with name ${streamName} does not exist`,
							);
							streamLogger.debug({
								msg: 'stream-not-exists',
								broadcastAuth: connection.broadcastAuth,
								status: connection.status(),
								eventName,
								args,
							});
					}
				});
			}
		}
		return results;
	}

	const onBroadcast = Meteor.bindEnvironment(broadcast);

	let TroubleshootDisableInstanceBroadcast;
	settings.watch('Troubleshoot_Disable_Instance_Broadcast', (value) => {
		if (TroubleshootDisableInstanceBroadcast === value) {
			return;
		}
		TroubleshootDisableInstanceBroadcast = value;

		if (value) {
			return StreamerCentral.removeListener('broadcast', onBroadcast);
		}

		// TODO move to a service and stop using StreamerCentral
		StreamerCentral.on('broadcast', onBroadcast);
	});
}

function getConnection(address) {
	const conn = connections[address];
	if (!conn) {
		return;
	}

	const { instanceRecord, broadcastAuth } = conn;

	return {
		address,
		currentStatus: conn._stream.currentStatus,
		instanceRecord,
		broadcastAuth,
	};
}

export function getInstanceConnection(instance) {
	const subPath = getURL('', { cdn: false, full: false });
	const address = `${instance.extraInformation.host}:${instance.extraInformation.port}${subPath}`;

	return getConnection(address);
}

Meteor.methods({
	'broadcastAuth'(remoteId, selfId) {
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

	'stream'(streamName, eventName, args) {
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
