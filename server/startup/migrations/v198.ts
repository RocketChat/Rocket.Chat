import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 198,
	up: async () => {
		const discussion = await Settings.findOneById('RetentionPolicy_DoNotExcludeDiscussion');
		const thread = await Settings.findOneById('RetentionPolicy_DoNotExcludeThreads');
		const pinned = await Settings.findOneById('RetentionPolicy_ExcludePinned');

		if (discussion) {
			await Settings.update(
				{
					_id: 'RetentionPolicy_DoNotPruneDiscussion',
				},
				{
					$set: {
						value: discussion.value,
					},
				},
				{
					upsert: true,
				},
			);
		}

		if (thread) {
			await Settings.update(
				{
					_id: 'RetentionPolicy_DoNotPruneThreads',
				},
				{
					$set: {
						value: thread.value,
					},
				},
				{
					upsert: true,
				},
			);
		}

		if (pinned) {
			await Settings.update(
				{
					_id: 'RetentionPolicy_DoNotPrunePinned',
				},
				{
					$set: {
						value: pinned.value,
					},
				},
				{
					upsert: true,
				},
			);
		}

		return Settings.deleteMany({
			_id: {
				$in: ['RetentionPolicy_DoNotExcludeDiscussion', 'RetentionPolicy_DoNotExcludeThreads', 'RetentionPolicy_ExcludePinned'],
			},
		});
	},
});
