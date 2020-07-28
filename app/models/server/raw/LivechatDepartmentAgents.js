import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentAgentsRaw extends BaseRaw {
	findUsersInQueue(usersList, options) {
		const query = {};

		if (Array.isArray(usersList) && usersList.length) {
			query.username = {
				$in: usersList,
			};
		}
		return this.find(query, options);
	}

	findByAgentId(agentId) {
		return this.find({ agentId });
	}

	findByDepartmentIds(departmentIds, options) {
		return this.find({ departmentId: { $in: departmentIds } }, options);
	}

	findActiveDepartmentsByAgentId(agentId) {
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
		const activeDepartmentsOnlyMatch = { $match: { 'departments.enabled': true } };
		const project = { $project: { departments: 0 } };
		return this.col.aggregate([match, lookup, unwind, activeDepartmentsOnlyMatch, project]).toArray();
	}
}
