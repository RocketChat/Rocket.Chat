import { isReportHistoryProps } from '@rocket.chat/rest-typings';
import { Reports } from '@rocket.chat/models';

import { API } from '../api';
// import { getReportHistory } from '../../../../server/lib/getReportHistory';

API.v1.addRoute(
	'moderation.history',
	{
		authRequired: true,
		validateParams: isReportHistoryProps,
	},
	{
		async get() {
			const { latest, oldest } = this.requestParams();

			const { count = 20, offset = 0 } = this.getPaginationItems();

			const { cursor, totalCount } = oldest
				? Reports.findReportsBetweenDates(latest ? new Date(latest) : new Date(), new Date(oldest), offset, count)
				: Reports.findReportsBeforeDate(latest ? new Date(latest) : new Date(), offset, count);

			const [reports, total] = await Promise.all([cursor.toArray(), totalCount]);
			// if (!reports) {
			// 	return API.v1.failure('No reports found');
			// }

			// console.log('reports', reports);

			return API.v1.success({
				reports,
				count: reports.length,
				offset,
				total,
			});
		},
	},
);
