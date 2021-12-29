import { LivechatDepartmentAgentsRaw } from '../../../../../app/models/server/raw/LivechatDepartmentAgents';
import { overwriteClassOnLicense } from '../../../license/server';

overwriteClassOnLicense('livechat-enterprise', LivechatDepartmentAgentsRaw, {
	findAgentsByAgentIdAndBusinessHourId(agentId: string, businessHourId: string): Promise<Record<string, any>> {
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
		const withBusinessHourId = { $match: { 'departments.businessHourId': businessHourId } };
		const project = { $project: { departments: 0 } };
		const model = this as unknown as LivechatDepartmentAgentsRaw;
		return model.col.aggregate([match, lookup, unwind, withBusinessHourId, project]).toArray();
	},
});
