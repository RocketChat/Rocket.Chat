// import { IInstanceStatus } from '@rocket.chat/core-typings';
import { EventEmitter } from 'events';

import { InstanceStatus as InstanceStatusModel } from '@rocket.chat/models';
import { v4 as uuidv4 } from 'uuid';

const events = new EventEmitter();

const defaultPingInterval = parseInt(String(process.env.MULTIPLE_INSTANCES_PING_INTERVAL)) || 10; // default to 10s

// if not set via env var ensures at least 3 ticks before expiring (multiple of 60s)
const indexExpire = (parseInt(String(process.env.MULTIPLE_INSTANCES_EXPIRE)) || Math.ceil((defaultPingInterval * 3) / 60)) * 60;

let createIndexes = async () => {
	await InstanceStatusModel.col
		.indexes()
		.catch(function () {
			// the collection should not exists yet, return empty then
			return [];
		})
		.then(function (result) {
			return result.some(function (index) {
				if (index.key && index.key._updatedAt === 1) {
					if (index.expireAfterSeconds !== indexExpire) {
						InstanceStatusModel.col.dropIndex(index.name);
						return false;
					}
					return true;
				}
				return false;
			});
		})
		.then(function (created) {
			if (!created) {
				InstanceStatusModel.col.createIndex({ _updatedAt: 1 }, { expireAfterSeconds: indexExpire });
			}
		});

	createIndexes = async () => {
		// no op
	};
};

const ID = uuidv4();

function id() {
	return ID;
}

const currentInstance = {
	name: '',
	extraInformation: {},
};

async function registerInstance(name: string, extraInformation: Record<string, unknown>): Promise<unknown> {
	createIndexes();

	currentInstance.name = name;
	currentInstance.extraInformation = extraInformation;

	// if (ID === undefined || ID === null) {
	// 	return console.error('[multiple-instances-status] only can be called after Meteor.startup');
	// }

	const instance = {
		$set: {
			pid: process.pid,
			name,
			...(extraInformation && { extraInformation }),
		},
		$currentDate: {
			_createdAt: true,
			_updatedAt: true,
		},
	};

	try {
		await InstanceStatusModel.updateOne({ _id: ID }, instance as any, { upsert: true });

		const result = await InstanceStatusModel.findOne({ _id: ID });

		start();

		events.emit('registerInstance', result, instance);

		process.on('exit', onExit);

		return result;
	} catch (e) {
		return e;
	}
}

async function unregisterInstance() {
	try {
		const result = await InstanceStatusModel.deleteOne({ _id: ID });
		stop();

		events.emit('unregisterInstance', ID);

		process.removeListener('exit', onExit);

		return result;
	} catch (e) {
		return e;
	}
}

let pingInterval: NodeJS.Timeout | null;

function start(interval?: number) {
	stop();

	interval = interval || defaultPingInterval;

	pingInterval = setInterval(function () {
		ping();
	}, interval * 1000);
}

function stop() {
	if (!pingInterval) {
		return;
	}
	clearInterval(pingInterval);
	pingInterval = null;
}

async function ping() {
	const result = await InstanceStatusModel.updateOne(
		{
			_id: ID,
		},
		{
			$currentDate: {
				_updatedAt: true,
			},
		},
	);

	if (result.modifiedCount === 0) {
		await registerInstance(currentInstance.name, currentInstance.extraInformation);
	}
}

async function onExit() {
	await unregisterInstance();
}

async function updateConnections(conns: number) {
	await InstanceStatusModel.updateOne(
		{
			_id: ID,
		},
		{
			$set: {
				'extraInformation.conns': conns,
			},
		},
	);
}

export const InstanceStatus = {
	id,
	registerInstance,
	updateConnections,
};
