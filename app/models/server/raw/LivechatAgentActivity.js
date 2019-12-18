import { BaseRaw } from './BaseRaw';

export class LivechatAgentActivityRaw extends BaseRaw {
	findAllAverageAvailableServiceTime({ date, departmentId }) {
		const match = { $match: { date } };
		const lookup = {
			$lookup: {
				from: 'rocketchat_livechat_department_agents',
				localField: 'agentId',
				foreignField: 'agentId',
				as: 'departments',
			},
		};
		const unwind = {
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		};
		const departmentsMatch = {
			$match: {
				'departments.departmentId': departmentId,
			},
		};
		const sumAvailableTimeWithCurrentTime = {
			$sum: [
				{ $divide: [{ $subtract: [new Date(), '$lastStartedAt'] }, 1000] },
				'$availableTime',
			],
		};
		const group = {
			$group: {
				_id: null,
				allAvailableTimeInSeconds: {
					$sum: {
						$cond: [{ $ifNull: ['$lastStoppedAt', false] },
							'$availableTime',
							sumAvailableTimeWithCurrentTime],
					},
				},
				rooms: { $sum: 1 },
			},
		};
		const project = {
			$project: {
				averageAvailableServiceTimeInSeconds: {
					$trunc: {
						$cond: [
							{ $eq: ['$rooms', 0] },
							0,
							{ $divide: ['$allAvailableTimeInSeconds', '$rooms'] },
						],
					},
				},
			},
		};
		const params = [match];
		if (departmentId) {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		params.push(project);
		return this.col.aggregate(params).toArray();
	}
}
