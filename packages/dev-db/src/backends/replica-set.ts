import { MongoClient } from 'mongodb';

const createClient = (port: number): MongoClient => {
	return new MongoClient(`mongodb://127.0.0.1:${port}/admin?directConnection=true`, {
		serverSelectionTimeoutMS: 3000,
	});
};

const sleep = async (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const ensureReplicaSetInitialized = async (params: {
	port: number;
	replicaSetName: string;
	maxAttempts?: number;
}): Promise<void> => {
	const { port, replicaSetName, maxAttempts = 20 } = params;

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		const client = createClient(port);
		try {
			await client.connect();
			const admin = client.db('admin');

			try {
				const status = (await admin.command({ replSetGetStatus: 1 })) as { ok?: number };
				if (status.ok === 1) {
					return;
				}
			} catch {
				await admin.command({
					replSetInitiate: {
						_id: replicaSetName,
						members: [{ _id: 0, host: `127.0.0.1:${port}` }],
					},
				});
			}
		} catch {
			// The server may still be starting up or already configuring RS.
		} finally {
			await client.close();
		}

		await sleep(1000);
	}

	throw new Error('Replica set initialization did not complete in time.');
};
