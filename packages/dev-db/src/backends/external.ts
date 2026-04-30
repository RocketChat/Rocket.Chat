import { runHealthGates } from '../health';
import { assertExternalMongoUrl, type DevDbBackend } from '../backend';
import type { DevDbState } from '../state-store';

const createState = (params: {
	mongoUrl: string;
	port: number;
	replicaSetEnabled: boolean;
	replicaSetName: string;
}): DevDbState => {
	const now = new Date().toISOString();

	return {
		version: 1,
		owner: {
			pid: process.pid,
			hostname: process.env.HOSTNAME || 'localhost',
			command: process.argv.join(' '),
		},
		backend: 'external',
		port: params.port,
		replicaSetName: params.replicaSetEnabled ? params.replicaSetName : undefined,
		startedAt: now,
		updatedAt: now,
	};
};

export const externalBackend: DevDbBackend = {
	kind: 'external',
	up: async (context) => {
		const mongoUrl = assertExternalMongoUrl(context.externalMongoUrl);
		await runHealthGates(mongoUrl, context.replicaSetEnabled);

		return {
			state: createState({
				mongoUrl,
				port: context.port,
				replicaSetEnabled: context.replicaSetEnabled,
				replicaSetName: context.replicaSetName,
			}),
			mongoUrl,
			mongoOplogUrl: context.replicaSetEnabled ? mongoUrl.replace(/\/[^/?]*/, '/local') : undefined,
		};
	},
	down: async () => {
		return;
	},
	logs: async () => {
		return 'External backend has no managed process logs. Inspect your external MongoDB logs directly.';
	},
	reset: async () => {
		return;
	},
};
