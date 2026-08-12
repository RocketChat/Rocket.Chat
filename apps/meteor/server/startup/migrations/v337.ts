import { PushToken } from '@rocket.chat/models';

import { SystemLogger } from '../../lib/logger/system';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 337,
	name: 'Move push token string into tokenValue/tokenType pair',
	async up() {
		const { col } = PushToken;

		// Split coexisting voip tokens into their own documents; the deterministic _id keeps this idempotent.
		// Writing back into the collection being aggregated is safe here only because the documents this
		// produces carry no `voipToken` and therefore can never re-enter the `$match` above.
		await col
			.aggregate([
				{ $match: { voipToken: { $exists: true, $ne: null } } },
				{
					$project: {
						_id: { $concat: [{ $toString: '$_id' }, '_voip'] },
						tokenType: 'voip',
						tokenValue: '$voipToken',
						appName: 1,
						userId: 1,
						authToken: 1,
						// `enabled`/`createdAt` are required by IPushToken but predate the fields being
						// written unconditionally, so don't propagate a missing value into the new document.
						enabled: { $ifNull: ['$enabled', true] },
						createdAt: { $ifNull: ['$createdAt', '$$NOW'] },
						_updatedAt: '$$NOW',
					},
				},
				{ $merge: { into: '_raix_push_app_tokens', whenMatched: 'replace', whenNotMatched: 'insert' } },
			])
			.toArray();

		await col.updateMany({ 'tokenValue': { $exists: false }, 'token.apn': { $exists: true } }, [
			{ $set: { tokenType: 'apn', tokenValue: '$token.apn' } },
			{ $unset: ['token', 'voipToken'] },
		]);

		await col.updateMany({ 'tokenValue': { $exists: false }, 'token.gcm': { $exists: true } }, [
			{ $set: { tokenType: 'gcm', tokenValue: '$token.gcm' } },
			{ $unset: ['token', 'voipToken'] },
		]);

		// Only drop documents that hold no token string at all. Anything still carrying a legacy
		// `token.apn`/`token.gcm` is either a document written by an instance that has not been
		// restarted onto this version yet, or one this migration is still converting on another
		// instance — the lock goes stale after 5 minutes, so a slow run can overlap with itself.
		// Deleting on `{ tokenValue: { $exists: false } }` alone would drop those live registrations.
		const { deletedCount } = await col.deleteMany({
			'tokenValue': { $exists: false },
			'token.apn': { $exists: false },
			'token.gcm': { $exists: false },
		});

		if (deletedCount) {
			SystemLogger.info({ msg: 'v337: removed push token documents holding no token string', deletedCount });
		}

		const leftBehind = await col.countDocuments({ tokenValue: { $exists: false } });
		if (leftBehind) {
			SystemLogger.warn({
				msg: 'v337: push token documents still on the legacy schema; they are ignored by the send path and will be replaced on the next device registration',
				count: leftBehind,
			});
		}

		await col.dropIndex('appName_1_token_1').catch(() => undefined);
		await PushToken.createIndexes();
	},
});
