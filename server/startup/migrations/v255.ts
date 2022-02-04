import { addMigration } from '../../lib/migrations';
import { LivechatDepartmentAgents, LivechatAgentActivity } from '../../../app/models/server';

addMigration({
	version: 255,
	up() {
		LivechatDepartmentAgents.tryDropIndex({ departmentEnabled: 1 });
		LivechatDepartmentAgents.tryDropIndex({ agentId: 1 });
		LivechatDepartmentAgents.tryDropIndex({ username: 1 });
		LivechatAgentActivity.tryDropIndex({ agentId: 1 });
	},
});
