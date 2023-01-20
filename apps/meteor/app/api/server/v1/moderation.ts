import { isReportHistoryProps } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { getReportHistory } from '../../../../server/lib/getReportHistory';

API.v1.addRoute(
	'moderation.history',
	{
		authRequired: true,
		twoFactorRequired: true,
		validateParams: isReportHistoryProps,
	},
	{
		get() {
			const { latest, oldest } = this.queryParams();

			const { count = 20, offset = 0 } = this.getPaginationItems();

			const reports = getReportHistory({ latest, oldest, count, offset });

			if (!reports) {
				return API.v1.failure('No reports found');
			}

			return API.v1.success(reports);
		},
	},
);
