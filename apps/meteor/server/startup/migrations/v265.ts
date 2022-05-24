import { addMigration } from '../../lib/migrations';
import { Integrations } from '../../../app/models/server/raw';

addMigration({
	version: 265,
	async up() {
		// Load all integrations that have an `avatarUrl` and don't have an `avatar`
		const integrations = await Integrations.find<{ _id: string; avatarUrl: string }>(
			{
				avatarUrl: {
					$exists: true,
					$ne: '',
				},
				$or: [{ avatar: { $exists: false } }, { avatar: '' }],
			},
			{
				projection: {
					avatarUrl: 1,
				},
			},
		).toArray();

		for (const { _id, avatarUrl } of integrations) {
			Integrations.updateOne({ _id }, { $set: { avatar: avatarUrl }, $unset: { avatarUrl: 1 } });
		}
	},
});
