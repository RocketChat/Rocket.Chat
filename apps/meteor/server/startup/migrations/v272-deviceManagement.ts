import { Sessions } from '@rocket.chat/models';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 272,
	async up() {
		await Promise.allSettled(
			['instanceId_1_sessionId_1_year_1_month_1_day_1', 'instanceId_1_sessionId_1', 'type_1'].map((idx) => Sessions.col.dropIndex(idx)),
		);
	},
});
