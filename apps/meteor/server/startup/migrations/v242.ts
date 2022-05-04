import { addMigration } from '../../lib/migrations';
import { LivechatInquiry } from '../../../app/models/server';
import { Settings } from '../../../app/models/server/raw';

function removeQueueTimeoutFromInquiries(): void {
	LivechatInquiry.update(
		{
			status: 'queued',
			estimatedInactivityCloseTimeAt: { $exists: true },
		},
		{ $unset: { estimatedInactivityCloseTimeAt: 1 } },
		{ multi: true },
	);
}

async function removeSetting(): Promise<void> {
	const oldSetting = await Settings.findOneById('Livechat_max_queue_wait_time_action');
	if (!oldSetting) {
		return;
	}
	const currentAction = oldSetting.value;

	if (currentAction === 'Nothing') {
		await Settings.update({ _id: 'Livechat_max_queue_wait_time' }, { $set: { value: -1 } }, { upsert: true });
	}
	await Settings.removeById('Livechat_max_queue_wait_time_action');
}

addMigration({
	version: 242,
	up() {
		removeQueueTimeoutFromInquiries();
		return removeSetting();
	},
});
