import { randomUUID } from 'node:crypto';

import type { IInstanceStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { InstanceStatus as InstanceStatusModel } from '@rocket.chat/models';

const logger = new Logger('InstanceStatus');

export const defaultPingInterval = parseInt(String(process.env.MULTIPLE_INSTANCES_PING_INTERVAL)) || 10;
export const indexExpire = (parseInt(String(process.env.MULTIPLE_INSTANCES_EXPIRE)) || Math.ceil((defaultPingInterval * 3) / 60)) * 60;

const ID = randomUUID();
const id = (): IInstanceStatus['_id'] => ID;

const currentInstance = {
	name: '',
	extraInformation: {},
};

let pingInterval: NodeJS.Timeout | null;

function start() {
	stop();
	pingInterval = setInterval(async () => ping(), defaultPingInterval * 1000);
}

function stop() {
	if (!pingInterval) {
		return;
	}
	clearInterval(pingInterval);
	pingInterval = null;
}

let createIndexes = async () => {
	createIndexes = async () => {
		// noop
	};

	const indexes = await InstanceStatusModel.col.indexes().catch(() => []);
	const expirationIndex = indexes.find((index) => index.key?._updatedAt === 1);

	if (expirationIndex?.expireAfterSeconds === indexExpire) {
		return;
	}

	if (expirationIndex?.name) {
		await InstanceStatusModel.col.dropIndex(expirationIndex.name);
	}

	await InstanceStatusModel.col.createIndex({ _updatedAt: 1 }, { expireAfterSeconds: indexExpire });
};

async function registerInstance(name: string, extraInformation: Partial<IInstanceStatus['extraInformation']>): Promise<unknown> {
	void createIndexes().catch((err) => logger.error({ msg: 'Error creating the instance status expiration index', err }));

	currentInstance.name = name;
	currentInstance.extraInformation = extraInformation;

	const result = await InstanceStatusModel.upsertInstance({
		_id: id(),
		pid: process.pid,
		name,
		extraInformation: extraInformation as IInstanceStatus['extraInformation'],
	});

	start();
	process.on('exit', onExit);

	return result;
}

async function unregisterInstance() {
	try {
		const result = await InstanceStatusModel.removeInstanceById(id());
		stop();
		process.removeListener('exit', onExit);
		return result;
	} catch (e) {
		return e;
	}
}

async function updateConnections(connections: number) {
	await InstanceStatusModel.updateConnections(id(), connections);
}

async function ping() {
	const result = await InstanceStatusModel.setDocumentHeartbeat(ID);

	if (result.modifiedCount === 0) {
		await registerInstance(currentInstance.name, currentInstance.extraInformation);
	}
}

async function onExit() {
	await unregisterInstance();
}

export const InstanceStatus = {
	defaultPingInterval,
	id,
	indexExpire,
	registerInstance,
	updateConnections,
};
