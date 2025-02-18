import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgentsRaw } from '@rocket.chat/models';

export class LivechatDepartmentAgents extends LivechatDepartmentAgentsRaw {
	findAgentsByAgentIdAndBusinessHourId(agentId: string, businessHourId: string): Promise<ILivechatDepartmentAgents[]> {
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
		return this.col.aggregate<ILivechatDepartmentAgents>([match, lookup, unwind, withBusinessHourId, project]).toArray();
	}
}
