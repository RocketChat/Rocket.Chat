import { API } from '../../../../../app/api/server';
import { findMonitors, findMonitorByUsername } from './lib/monitors';

API.v1.addRoute(
	'livechat/monitors.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				Promise.await(
					findMonitors({
						userId: this.userId,
						text,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/monitors.getOne',
	{ authRequired: true },
	{
		get() {
			const { username } = this.queryParams;

			return API.v1.success(
				Promise.await(
					findMonitorByUsername({
						userId: this.userId,
						username,
					}),
				),
			);
		},
	},
);
