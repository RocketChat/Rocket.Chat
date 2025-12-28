import type { IInstanceStatus } from '@rocket.chat/core-typings';
import { InstanceStatus as InstanceStatusModel } from '@rocket.chat/models';
import { v4 as uuidv4 } from 'uuid';

export const defaultPingInterval = parseInt(String(process.env.MULTIPLE_INSTANCES_PING_INTERVAL)) || 10;
export const indexExpire = (parseInt(String(process.env.MULTIPLE_INSTANCES_EXPIRE)) || Math.ceil((defaultPingInterval * 3) / 60)) * 60;

const ID = uuidv4();
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
	await InstanceStatusModel.col
		.indexes()
		.catch(() => [])
		.then((result) =>
			result.some((index) => {
				if (index.key && index.key._updatedAt === 1) {
					if (index.expireAfterSeconds !== indexExpire && index.name) {
						InstanceStatusModel.col.dropIndex(index.name);
						return false;
					}
					return true;
				}
				return false;
			}),
		)
		.then((created) => {
			if (!created) {
				InstanceStatusModel.col.createIndex({ _updatedAt: 1 }, { expireAfterSeconds: indexExpire });
			}
		});

	createIndexes = async () => {
		// noop
	};
};

async function registerInstance(name: string, extraInformation: Partial<IInstanceStatus['extraInformation']>): Promise<unknown> {
	createIndexes();

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
