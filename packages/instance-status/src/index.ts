import { InstanceStatus as InstanceStatusModel } from '@rocket.chat/models';
import { v4 as uuidv4 } from 'uuid';

export const defaultPingInterval = parseInt(String(process.env.MULTIPLE_INSTANCES_PING_INTERVAL)) || 10; // default to 10s
export const indexExpire = (parseInt(String(process.env.MULTIPLE_INSTANCES_EXPIRE)) || Math.ceil((defaultPingInterval * 3) / 60)) * 60;

const ID = uuidv4();

const currentInstance = {
	name: '',
	extraInformation: {},
};

let pingInterval: NodeJS.Timeout | null;

export function id() {
	return ID;
}

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
					if (index.expireAfterSeconds !== indexExpire) {
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

	createIndexes = async () => {};
};

async function updateInstanceOnDB(instance: any) {
	try {
		return InstanceStatusModel.findOneAndUpdate(
			{ _id: ID },
			{
				$set: instance,
				$currentDate: { _createdAt: true, _updatedAt: true },
			},
			{ upsert: true, returnDocument: 'after' },
		);
	} catch (e) {
		return e;
	}
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

async function deleteInstanceOnDB() {
	try {
		await InstanceStatusModel.deleteOne({ _id: ID });
	} catch (e) {
		return e;
	}
}

export async function registerInstance(name: string, extraInformation: Record<string, unknown>): Promise<unknown> {
	createIndexes();

	currentInstance.name = name;
	currentInstance.extraInformation = extraInformation;

	const result = await updateInstanceOnDB({
		pid: process.pid,
		name,
		...(extraInformation && { extraInformation }),
	});

	start();
	process.on('exit', onExit);

	return result;
}

async function unregisterInstance() {
	try {
		const result = await deleteInstanceOnDB();
		stop();
		process.removeListener('exit', onExit);
		return result;
	} catch (e) {
		return e;
	}
}

async function ping() {
	const result = await InstanceStatusModel.setDocumentHeartbeat(ID);

	console.log(`[${ID}] ping`, result.modifiedCount);

	if (result.modifiedCount === 0) {
		await registerInstance(currentInstance.name, currentInstance.extraInformation);
	}
}

async function onExit() {
	await unregisterInstance();
}

export const InstanceStatus = {
	id,
	registerInstance,
	updateConnections,
	defaultPingInterval,
	indexExpire,
};
