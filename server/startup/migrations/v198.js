import { Settings } from '../../../app/models/server';
import { Migrations } from '../../../app/migrations/server';

Migrations.add({
	version: 198,
	up: () => {
		const discussion = Settings.findOneById('RetentionPolicy_DoNotExcludeDiscussion');
		const thread = Settings.findOneById('RetentionPolicy_DoNotExcludeThreads');
		const pinned = Settings.findOneById('RetentionPolicy_ExcludePinned');

		if (discussion) {
			Settings.upsert({
				_id: 'RetentionPolicy_DoNotPruneDiscussion',
			}, {
				$set: {
					value: discussion.value,
				},
			});
		}

		if (thread) {
			Settings.upsert({
				_id: 'RetentionPolicy_DoNotPruneThreads',
			}, {
				$set: {
					value: thread.value,
				},
			});
		}

		if (pinned) {
			Settings.upsert({
				_id: 'RetentionPolicy_DoNotPrunePinned',
			}, {
				$set: {
					value: pinned.value,
				},
			});
		}

		Settings.remove({
			_id: { $in: ['RetentionPolicy_DoNotExcludeDiscussion', 'RetentionPolicy_DoNotExcludeThreads', 'RetentionPolicy_ExcludePinned'] },
		});
	},
});
