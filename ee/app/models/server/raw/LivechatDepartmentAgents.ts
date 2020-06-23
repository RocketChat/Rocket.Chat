import { LivechatDepartmentAgentsRaw as Raw } from '../../../../../app/models/server/raw/LivechatDepartmentAgents';
import { LivechatDepartmentAgents } from '../../../../../app/models/server';

export class LivechatDepartmentAgentsRaw extends Raw {
	findDepartmentsWithBusinessHourByAgentId(agentId: string): Promise<Record<string, any>> {
		const match = {
			$match: { agentId },
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		};
		const unwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const withBusinessHourId = { $match: { 'departments.businessHourId': { $exists: true } } };
		const project = { $project: { departments: 0 } };
		return this.col.aggregate([match, lookup, unwind, withBusinessHourId, project]).toArray();
	}
}

export default new LivechatDepartmentAgentsRaw(LivechatDepartmentAgents.model.rawCollection());
