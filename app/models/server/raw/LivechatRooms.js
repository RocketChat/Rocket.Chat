import { BaseRaw } from './BaseRaw';
import { getValue } from '../../../settings/server/raw';

export class LivechatRoomsRaw extends BaseRaw {
	async findAllNumberOfAbandonedRooms({ start, end, departmentId, options = {} }) {
		const roomsFilter = [
			{ $gte: ['$$room.ts', new Date(start)] },
			{ $lte: ['$$room.ts', new Date(end)] },
			{ $gte: ['$$room.metrics.visitorInactivity', await getValue('Livechat_visitor_inactivity_timeout')] },
		];
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
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$departments._id',
					name: '$departments.name',
				},
				rooms: { $push: '$$ROOT' },
			},
		};
		const projects = [
			{
				$project: {
					rooms: {
						$filter: {
							input: '$rooms',
							as: 'room',
							cond: {
								$and: roomsFilter,
							},
						},
					},
				},
			},
			{
				$project: {
					_id: { $ifNull: ['$_id.departmentId', null] },
					name: { $ifNull: ['$_id.name', null] },
					abandonedRooms: { $size: '$rooms' },
				},
			}];
		const match = {
			$match: {
				t: 'l',
			},
		};
		const firstParams = [match, lookup, unwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'departments._id': departmentId,
				},
			});
		}
		const params = [...firstParams, group, ...projects];
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		if (options.sort) {
			params.push({ $sort: { name: 1 } });
		}
		return this.col.aggregate(params).toArray();
	}
}
