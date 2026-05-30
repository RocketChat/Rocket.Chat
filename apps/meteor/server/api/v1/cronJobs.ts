import { CronJobsSvc } from '@rocket.chat/core-services';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.get('cron.jobs', { authRequired: true }, async function action() {
	const { offset, count } = await getPaginationItems(this.queryParams);
	const { jobs, total } = await CronJobsSvc.getCoreJobs({ offset, count });

	return API.v1.success({
		jobs,
		count: jobs.length,
		offset,
		total,
	});
});

API.v1.get('cron.appjobs', { authRequired: true }, async function action() {
	const { offset, count } = await getPaginationItems(this.queryParams);
	const { jobs, total } = await CronJobsSvc.getAppJobs({ offset, count });

	return API.v1.success({
		jobs,
		count: jobs.length,
		offset,
		total,
	});
});

API.v1.get('cron.history', { authRequired: true }, async function action() {
	const { offset, count } = await getPaginationItems(this.queryParams);
	const { jobName } = this.queryParams;
	const { history, total } = await CronJobsSvc.getHistory(jobName, { offset, count });

	return API.v1.success({
		history,
		count: history.length,
		offset,
		total,
	});
});
