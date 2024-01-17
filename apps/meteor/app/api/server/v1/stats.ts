import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'statistics',
	{ authRequired: true },
	{
		async get() {
			const { refresh = 'false' } = this.queryParams;

			return API.v1.success(
				await getLastStatistics({
					userId: this.userId,
					refresh: refresh === 'true',
				}),
			);
		},
	},
);

API.v1.addRoute(
	'statistics.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			return API.v1.success(
				await getStatistics({
					userId: this.userId,
					query,
					pagination: {
						offset,
						count,
						sort,
						fields,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'statistics.telemetry',
	{ authRequired: true },
	{
		post() {
			const events = this.bodyParams;

			events?.params?.forEach((event) => {
				const { eventName, ...params } = event;
				void telemetryEvent.call(eventName, params);
			});

			return API.v1.success();
		},
	},
);
