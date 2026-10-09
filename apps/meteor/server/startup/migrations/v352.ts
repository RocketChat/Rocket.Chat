import { Invites, Migrations } from '@rocket.chat/models';

import { client } from '../../database/utils';
import { addMigration } from '../../lib/migrations';

const batchSize = 1000;
const legacyInviteGracePeriodDays = 90;

addMigration({
	version: 352,
	name: 'Separate legacy invite tokens from record IDs and expire unlimited legacy links after 90 days',
	async up() {
		const expiresAt = new Date();
		expiresAt.setUTCDate(expiresAt.getUTCDate() + legacyInviteGracePeriodDays);
		const transition = await Migrations.findOneAndUpdate<{ expiresAt: Date }>(
			{ _id: 'legacy-invite-transition' },
			{ $setOnInsert: { expiresAt } },
			{ upsert: true, returnDocument: 'after' },
		);
		if (!transition) {
			throw new Error('Could not initialize the legacy invite transition');
		}

		await client.withSession(async (session) => {
			let ids: string[];
			do {
				ids = await Invites.find({ inviteToken: { $exists: false } }, { projection: { _id: 1 }, limit: batchSize })
					.map(({ _id }) => _id)
					.toArray();

				for (const _id of ids) {
					await session.withTransaction(async () => Invites.migrateLegacyInvite(_id, transition.expiresAt, session));
				}
			} while (ids.length === batchSize);
		});

		await Invites.col.createIndex({ inviteToken: 1 }, { unique: true, partialFilterExpression: { inviteToken: { $type: 'string' } } });
	},
});
