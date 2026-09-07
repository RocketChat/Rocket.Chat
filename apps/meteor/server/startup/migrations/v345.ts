import { PushToken } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 345,
	name: 'Move push token string into tokenValue/tokenType pair',
	async up() {
		const { col } = PushToken;

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
						enabled: 1,
						createdAt: 1,
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

		await col.deleteMany({ tokenValue: { $exists: false } });

		await col.dropIndex('appName_1_token_1').catch(() => undefined);
		await PushToken.createIndexes();
	},
});
