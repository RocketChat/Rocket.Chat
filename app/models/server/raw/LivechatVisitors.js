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
}
