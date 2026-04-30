import net from 'node:net';
import { MongoClient } from 'mongodb';
import { DEV_DB_EXIT_CODES } from './exit-codes';
import { DevDbError } from './errors';

export type HealthResult = {
	tcpReachable: boolean;
	adminPing: boolean;
	writablePrimary: boolean;
};

const parsePort = (mongoUrl: string): number | undefined => {
	try {
		const url = new URL(mongoUrl);
		if (!url.port) {
			return 27017;
		}
		return Number(url.port);
	} catch {
		return undefined;
	}
};

const parseHost = (mongoUrl: string): string | undefined => {
	try {
		const url = new URL(mongoUrl);
		return url.hostname;
	} catch {
		return undefined;
	}
};

export const assertTcpReachable = async (mongoUrl: string): Promise<void> => {
	const host = parseHost(mongoUrl);
	const port = parsePort(mongoUrl);

	if (!host || !port) {
		throw new DevDbError('Invalid Mongo URL for TCP health check.', DEV_DB_EXIT_CODES.INVALID_ARGUMENT, { mongoUrl });
	}

	await new Promise<void>((resolve, reject) => {
		const socket = net.connect({ host, port });
		socket.setTimeout(3000);
		socket.once('connect', () => {
			socket.end();
			resolve();
		});
		socket.once('timeout', () => {
			socket.destroy();
			reject(new DevDbError('Mongo TCP health check timed out.', DEV_DB_EXIT_CODES.HEALTH_TCP_FAILED, { host, port }));
		});
		socket.once('error', (error) => {
			socket.destroy();
			reject(new DevDbError('Mongo TCP health check failed.', DEV_DB_EXIT_CODES.HEALTH_TCP_FAILED, {
				host,
				port,
				error: error.message,
			}));
		});
	});
};

const createMongoClient = (mongoUrl: string): MongoClient => {
	return new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 3000 });
};

export const assertAdminPing = async (mongoUrl: string): Promise<void> => {
	const client = createMongoClient(mongoUrl);
	try {
		await client.connect();
		await client.db('admin').command({ ping: 1 });
	} catch (error) {
		throw new DevDbError('Mongo admin ping failed.', DEV_DB_EXIT_CODES.HEALTH_PING_FAILED, {
			error: (error as Error).message,
		});
	} finally {
		await client.close();
	}
};

export const assertWritablePrimary = async (mongoUrl: string, replicaSetEnabled: boolean): Promise<void> => {
	if (!replicaSetEnabled) {
		return;
	}

	const client = createMongoClient(mongoUrl);
	try {
		await client.connect();
		const hello = (await client.db('admin').command({ hello: 1 })) as {
			isWritablePrimary?: boolean;
		};

		if (!hello.isWritablePrimary) {
			throw new DevDbError('Mongo writable-primary health gate failed.', DEV_DB_EXIT_CODES.HEALTH_WRITABLE_PRIMARY_FAILED);
		}
	} catch (error) {
		if (error instanceof DevDbError) {
			throw error;
		}
		throw new DevDbError('Mongo writable-primary health gate failed.', DEV_DB_EXIT_CODES.HEALTH_WRITABLE_PRIMARY_FAILED, {
			error: (error as Error).message,
		});
	} finally {
		await client.close();
	}
};

export const runHealthGates = async (mongoUrl: string, replicaSetEnabled: boolean): Promise<HealthResult> => {
	await assertTcpReachable(mongoUrl);
	await assertAdminPing(mongoUrl);
	await assertWritablePrimary(mongoUrl, replicaSetEnabled);

	return {
		tcpReachable: true,
		adminPing: true,
		writablePrimary: replicaSetEnabled ? true : true,
	};
};
