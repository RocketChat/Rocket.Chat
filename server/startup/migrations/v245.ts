import { addMigration } from '../../lib/migrations';
import { LivechatAgentActivity, LivechatDepartmentAgents, LivechatInquiry, LivechatRooms } from '../../../app/models/server';

addMigration({
	version: 245,
	up() {
		// remove unused omnichannel indexes
		LivechatAgentActivity.tryDropIndex({ date: 1 });
		LivechatAgentActivity.tryDropIndex({ agentId: 1 });

		LivechatDepartmentAgents.tryDropIndex({ departmentId: 1 });
		LivechatDepartmentAgents.tryDropIndex({ departmentEnabled: 1 });
		LivechatDepartmentAgents.tryDropIndex({ agentId: 1 });

		LivechatInquiry.tryDropIndex({ name: 1 });
		LivechatInquiry.tryDropIndex({ message: 1 });
		LivechatInquiry.tryDropIndex({ status: 1 });

		LivechatRooms.tryDropIndex({ open: 1 });
		LivechatRooms.tryDropIndex({ 'v.token': 1 });
	},
});
