import { addMigration } from '../../lib/migrations';
import { LivechatInquiry, Settings } from '../../../app/models/server';

function removeQueueTimeoutFromInquiries(): void {
	LivechatInquiry.update({
		status: 'queued',
		estimatedInactivityCloseTimeAt: { $exists: true },
	}, { $unset: { estimatedInactivityCloseTimeAt: 1 } }, { multi: true });
}

function removeSetting(): void {
	const oldSetting = Settings.findOneById('Livechat_max_queue_wait_time_action');
	if (!oldSetting) {
		return;
	}
	const currentAction = oldSetting.value;

	if (currentAction === 'Nothing') {
		Settings.upsert({ _id: 'Livechat_max_queue_wait_time' }, { $set: { value: -1 } });
	}
	Settings.removeById('Livechat_max_queue_wait_time_action');
}

addMigration({
	version: 242,
	up() {
		removeQueueTimeoutFromInquiries();
		removeSetting();
	},
});
