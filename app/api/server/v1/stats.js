import { API } from '../api';
import { getStatistics, getLastStatistics } from '../../../statistics/server';
import { engagemendDashboardCount } from '../../../../ee/app/settings/server/engagementDashboard';
import { messageAuditingApplyCount } from '../../../../ee/app/settings/server/messageAuditing';

API.v1.addRoute(
	'statistics',
	{ authRequired: true },
	{
		get() {
			const { refresh } = this.requestParams();
			return API.v1.success(
				Promise.await(
					getLastStatistics({
						userId: this.userId,
						refresh: refresh && refresh === 'true',
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'statistics.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			return API.v1.success(
				Promise.await(
					getStatistics({
						userId: this.userId,
						query,
						pagination: {
							offset,
							count,
							sort,
							fields,
						},
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'statistics.telemetry',
	{ authRequired: false },
	{
		post() {
			const events = this.requestParams();
			events.forEach((event) => {
				switch (event.eventName) {
					case 'engagementDashboard':
						engagemendDashboardCount();
						break;
					case 'messageAuditingApply':
						messageAuditingApplyCount();
						break;
				}
			});

			return API.v1.success();
		},
	},
);
