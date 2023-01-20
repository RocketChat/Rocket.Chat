import type { IReport } from '@rocket.chat/core-typings';

import { Base } from './_Base';

class Reports extends Base {
	constructor() {
		super('reports');
	}

	findReportsBetweenDates(latest: Date, oldest: Date | undefined, offset = 0, count = 20): Array<IReport> {
		const query = {
			ts: {
				$lt: latest,
				...(oldest && { $gt: oldest }),
			},
		};

		return this.find(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		}).fetch();
	}

	findReportsByRoom(roomId: string, offset = 0, count = 20): Array<IReport> {
		const query = {
			'message.rid': roomId,
		};

		return this.find(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		}).fetch();
	}

	findReportsByUser(userId: string, offset = 0, count = 20): Array<IReport> {
		const query = {
			userId: userId,
		};

		return this.find(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		}).fetch();
	}

	findReportsBeforeDate(oldest: string, offset = 0, count = 20): Array<IReport> {
		const query = {
			ts: {
				$gt: oldest,
			},
		};

		return this.find(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		}).fetch();
	}

	findReportsAfterDate(latest: string, offset = 0, count = 20): Array<IReport> {
		const query = {
			ts: {
				$lt: latest,
			},
		};

		return this.find(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		}).fetch();
	}
}

export default new Reports();
