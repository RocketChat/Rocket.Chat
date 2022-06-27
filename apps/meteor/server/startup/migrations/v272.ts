import { appTokensCollection } from '../../../app/push/server/push';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 272,
	async up() {
		return appTokensCollection.rawCollection().updateMany(
			{},
			{
				$set: {
					expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					usesLeft: 7,
				},
			},
		);
	},
});
