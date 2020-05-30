import s from 'underscore.string';

import { BaseRaw } from './BaseRaw';

export class LivechatVisitorsRaw extends BaseRaw {
	getVisitorsBetweenDate({ start, end, department }) {
		const query = {
			_updatedAt: {
				$gte: new Date(start),
				$lt: new Date(end),
			},
			...department && department !== 'undefined' && { department },
		};

		return this.find(query, { fields: { _id: 1 } });
	}

	findByNameRegexWithExceptionsAndConditions(searchTerm, exceptions = [], conditions = {}, options = {}) {
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const nameRegex = new RegExp(`^${ s.escapeRegExp(searchTerm).trim() }`, 'i');

		const match = {
			$match: {
				name: nameRegex,
				_id: {
					$nin: exceptions,
				},
				...conditions,
			},
		};

		const { fields, sort, offset, count } = options;
		const project = {
			$project: {
				custom_name: { $concat: ['$username', ' - ', '$name'] },
				...fields,
			},
		};

		const order = { $sort: sort || { name: 1 } };
		const params = [match, project, order];

		if (offset) {
			params.push({ $skip: offset });
		}

		if (count) {
			params.push({ $limit: count });
		}

		return this.col.aggregate(params);
	}
}
