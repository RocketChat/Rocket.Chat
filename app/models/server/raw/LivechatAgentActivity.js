import moment from 'moment';

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
		if (departmentId && departmentId !== 'undefined') {
			params.push(lookup);
			params.push(unwind);
			params.push(departmentsMatch);
		}
		params.push(group);
		params.push(project);
		return this.col.aggregate(params).toArray();
	}

	findAvailableServiceTimeHistory({ start, end, fullReport, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				date: {
					$gte: parseInt(moment(start).format('YYYYMMDD')),
					$lte: parseInt(moment(end).format('YYYYMMDD')),
				},
			},
		};
		const lookup = {
			$lookup: {
				from: 'users',
				localField: 'agentId',
				foreignField: '_id',
				as: 'user',
			},
		};
		const unwind = {
			$unwind: {
				path: '$user',
			},
		};
		const group = {
			$group: {
				_id: { _id: '$user._id', username: '$user.username' },
				serviceHistory: { $first: '$serviceHistory' },
				availableTimeInSeconds: { $sum: '$availableTime' },
			},
		};
		const project = {
			$project: {
				_id: 0,
				username: '$_id.username',
				availableTimeInSeconds: 1,
			},
		};
		if (fullReport) {
			project.$project.serviceHistory = 1;
		}
		const sort = { $sort: options.sort || { username: 1 } };
		const params = [match, lookup, unwind, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params, { allowDiskUse: true });
	}
}
