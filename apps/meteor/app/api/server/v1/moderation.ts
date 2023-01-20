import { API } from '../api';
import { isReportHistoryProps } from '@rocket.chat/rest-typings';
import { getReportHistory } from '/server/lib/getReportHistory';
import { hasPermission } from '../../../authorization/server';

API.v1.addRoute(
	'moderation.history',
	{
		authRequired: true,
		twoFactorRequired: true,
		validateParams: isReportHistoryProps,
	},
	{
		get() {
			if (!this.userId) {
				return API.v1.unauthorized();
			}

			if (!this.hasPermission(this.userId, 'view-moderation-console')) {
				return API.v1.unauthorized();
			}

			const { latest, oldest } = this.queryParams();

			const { count = 20, offset = 0 } = this.getPaginationItems();

			const reports = getReportHistory({ latest, oldest, count });

			if (!reports) {
				return API.v1.failure('No reports found');
			}

			return API.v1.success(reports);
		},
	},
);
