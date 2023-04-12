import { OAuthAccessTokens } from '@rocket.chat/models';
import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 293,
	name: 'Consolidate OAuth Access and Refresh Tokens',
	async up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const refreshTokenCollection = mongo.db.collection('rocketchat_oauth_refresh_tokens');

		await OAuthAccessTokens.updateMany({ expires: { $exists: true } }, { $rename: { expires: 'accessTokenExpiresAt' } });

		const cursor = OAuthAccessTokens.find({ refreshToken: { $exists: false } }, { sort: { accessTokenExpiresAt: -1 } });

		for await (const accessToken of cursor) {
			const refreshTokens = await refreshTokenCollection
				.find(
					{
						clientId: accessToken.clientId,
						userId: accessToken.userId,
						consolidated: { $ne: true },
					},
					{ sort: { expires: -1 } },
				)
				.toArray();

			if (refreshTokens.length === 0) {
				continue;
			}

			await OAuthAccessTokens.updateOne(
				{ _id: accessToken._id },
				{
					$set: {
						refreshToken: refreshTokens[0].refreshToken,
						refreshTokenExpiresAt: refreshTokens[0].expires,
					},
				},
			);

			await refreshTokenCollection.deleteOne({ _id: refreshTokens[0]._id });
			await refreshTokenCollection.updateMany(
				{
					clientId: accessToken.clientId,
					userId: accessToken.userId,
				},
				{ $set: { consolidated: true } },
			);
		}

		await OAuthAccessTokens.deleteMany({ refreshTokenExpiresAt: { $exists: false } });

		if ((await refreshTokenCollection.countDocuments()) === 0) {
			await refreshTokenCollection.drop();
		} else {
			await refreshTokenCollection.rename('rocketchat_oauth_refresh_tokens_migration_backup');
			console.warn(
				`Some OAuth refresh tokens were duplicated for the Access Tokens. Please review the items left at "rocketchat_oauth_refresh_tokens_migration_backup" and remove the collection when done`,
			);
		}
	},
});
