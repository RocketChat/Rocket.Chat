import { addMigration } from '../../lib/migrations';
import { LivechatDepartmentAgents, LivechatAgentActivity, LivechatRooms } from '../../../app/models/server';

addMigration({
	version: 257,
	up() {
		LivechatDepartmentAgents.tryDropIndex({ departmentEnabled: 1 });
		LivechatDepartmentAgents.tryDropIndex({ agentId: 1 });
		LivechatDepartmentAgents.tryDropIndex({ username: 1 });
		LivechatDepartmentAgents.tryDropIndex({ departmentId: 1 });
		LivechatAgentActivity.tryDropIndex({ agentId: 1 });
		LivechatRooms.tryDropIndex({ open: 1 });
		LivechatRooms.tryDropIndex({ 'v.token': 1 });
	},
});
