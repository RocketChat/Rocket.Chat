import { MongoClient } from 'mongodb';

import type { Completeness } from './report';

/** Counts the run's load messages that reached the database, by the federation event id derived from their stanza id. */
export async function checkCompleteness(mongoUrl: string, runId: string, expected: number): Promise<Completeness> {
	const client = await MongoClient.connect(mongoUrl);
	try {
		const [result] = await client
			.db()
			.collection('rocketchat_message')
			.aggregate<{ unique: number; total: number }>([
				{ $match: { 'federation.eventId': { $regex: `^xmpp:[^:]+:lt-${runId}-\\d+$` } } },
				{ $group: { _id: '$federation.eventId', copies: { $sum: 1 } } },
				{ $group: { _id: null, unique: { $sum: 1 }, total: { $sum: '$copies' } } },
			])
			.toArray();

		const persisted = result?.unique ?? 0;
		return { expected, persisted, duplicates: (result?.total ?? 0) - persisted, missing: expected - persisted };
	} finally {
		await client.close();
	}
}
