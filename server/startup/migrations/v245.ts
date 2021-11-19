import { addMigration } from '../../lib/migrations';
import { Apps } from '../../../app/apps/server/orchestrator';

addMigration({
	version: 245,
	up() {
		// we now have a compound index on appId + associations
		// so we can use the index prefix instead of a separate index on appId
		return Apps._persistModel?.tryDropIndex({ appId: 1 });
	},
});
