import { isReportHistoryProps } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { getReportHistory } from '../../../../server/lib/getReportHistory';
import { Reports } from '@rocket.chat/models';

API.v1.addRoute(
	'moderation.history',
	{
		authRequired: true,
		twoFactorRequired: true,
		validateParams: isReportHistoryProps,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { latest, oldest } = this.requestParams();

			const { count = 20, offset = 0 } = this.getPaginationItems();


			const { cursor, totalCount } = Reports.findReportsBetweenDates(latest ? new Date(latest) : new Date(), oldest, count, offset);

			const [reports, total] = await Promise.all([cursor.toArray(), totalCount]);
			// if (!reports) {
			// 	return API.v1.failure('No reports found');
			// }

			return API.v1.success({
				reports: reports,
				count: reports.length,
				offset,
				total,
			});
		},
	},
);
