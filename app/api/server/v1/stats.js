import { API } from '../api';
import { getStatistics, getLastStatistics, updateCounter, slashCommandsStats } from '../../../statistics/server';

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
						updateCounter('Engagement_Dashboard_Load_Count');
						break;
					case 'messageAuditingApply':
						updateCounter('Message_Auditing_Apply_Count');
						break;
					case 'jitsiCallButton':
						updateCounter('Jits_Click_To_Join_Count');
						break;
					case 'slashCommands':
						slashCommandsStats(event.command);
						break;
				}
			});

			return API.v1.success();
		},
	},
);
