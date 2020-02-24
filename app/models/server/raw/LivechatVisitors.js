import { BaseRaw } from './BaseRaw';

export class LivechatVisitorsRaw extends BaseRaw {
	getVisitorsBetweenDate({ start, end }) {
		const query = {
			_updatedAt: {
				$gte: new Date(start),
				$lt: new Date(end),
			},
		};

		return this.find(query, { fields: { _id: 1 } });
	}
}
