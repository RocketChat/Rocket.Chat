import { registerModel } from '@rocket.chat/models';

import { LivechatDepartmentAgentsRaw } from '../../../../../server/models/raw/LivechatDepartmentAgents';
import { overwriteClassOnLicense } from '../../../license/server';
import { db } from '../../../../../server/database/utils';
import { trashCollection } from '../../../../../server/database/trash';

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

registerModel('ILivechatDepartmentAgentsModel', new LivechatDepartmentAgentsRaw(db, trashCollection));
