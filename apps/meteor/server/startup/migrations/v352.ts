import { Invites, Migrations } from '@rocket.chat/models';

import { client } from '../../database/utils';
import { addMigration } from '../../lib/migrations';

const batchSize = 1000;
const transactionChunkSize = 100;
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
			let lastId: string | undefined;
			do {
				ids = await Invites.find(
					{ inviteToken: { $exists: false }, ...(lastId !== undefined && { _id: { $gt: lastId } }) },
					{ projection: { _id: 1 }, sort: { _id: 1 }, hint: '_id_', limit: batchSize },
				)
					.map(({ _id }) => _id)
					.toArray();

				for (let offset = 0; offset < ids.length; offset += transactionChunkSize) {
					const chunk = ids.slice(offset, offset + transactionChunkSize);
					await session.withTransaction(async () => Invites.migrateLegacyInvites(chunk, transition.expiresAt, session));
				}
				lastId = ids.at(-1);
			} while (ids.length === batchSize);
		});

		await Invites.col.createIndex({ inviteToken: 1 }, { unique: true, partialFilterExpression: { inviteToken: { $type: 'string' } } });
	},
});
