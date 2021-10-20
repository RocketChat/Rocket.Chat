import { addMigration } from '../../lib/migrations';
import { LivechatInquiry, Settings } from '../../../app/models/server';

function removeQueueTimeoutFromInquiries(): void {
	LivechatInquiry.update({
		status: 'queued',
		estimatedInactivityCloseTimeAt: { $exists: true },
	}, { $unset: { estimatedInactivityCloseTimeAt: 1 } }, { multi: true });
}

function removeSetting(): void {
	const currentAction = Settings.findById('Livechat_max_queue_wait_time_action');
	console.log(currentAction);
	if (currentAction === 'Nothing') {
		Settings.upsert({ _id: 'Livechat_max_queue_wait_time' }, { $set: { value: -1 } });
	}
	Settings.removeById('Livechat_max_queue_wait_time_action');
}

addMigration({
	version: 241,
	up() {
		removeQueueTimeoutFromInquiries();
		removeSetting();
	},
});
