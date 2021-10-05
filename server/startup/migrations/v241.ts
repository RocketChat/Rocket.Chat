import { addMigration } from '../../lib/migrations';
import { LivechatInquiry } from '../../../app/models/server';

function removeQueueTimeoutFromInquiries(): void {
	LivechatInquiry.update({
		status: 'queued',
		estimatedInactivityCloseTimeAt: { $exists: true },
	}, { $unset: { estimatedInactivityCloseTimeAt: 1 } }, { multi: true });
}

addMigration({
	version: 241,
	up() {
		removeQueueTimeoutFromInquiries();
	},
});
