import { CronJobsSvc } from '@rocket.chat/core-services';

import { API } from '../api';

API.v1.get(
	'cron.jobs',
	{ authRequired: true },
	async function action() {
		const { jobs } = await CronJobsSvc.getCoreJobs();

		return API.v1.success({ jobs });
	},
);