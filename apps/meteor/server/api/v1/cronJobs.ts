import { CronJobsSvc } from '@rocket.chat/core-services';
import { ajv, ajvQuery, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const isCronJobsListParams = ajvQuery.compile<{
	offset?: number;
	count?: number;
}>({
	type: 'object',
	properties: {
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
	},
	additionalProperties: false,
});

const isCronJobsActionParams = ajv.compile<{
	jobName: string;
}>({
	type: 'object',
	properties: {
		jobName: { type: 'string' },
	},
	required: ['jobName'],
	additionalProperties: false,
});

const isCronJobsHistoryParams = ajvQuery.compile<{
	jobName: string;
	offset?: number;
	count?: number;
}>({
	type: 'object',
	properties: {
		jobName: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
	},
	required: ['jobName'],
	additionalProperties: false,
});

const cronJobsEndpoints = API.v1
	.get(
		'cron.jobs',
		{
			authRequired: true,
			query: isCronJobsListParams,
			response: {
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { jobs, total } = await CronJobsSvc.getCoreJobs({ offset, count });

			return API.v1.success({
				jobs,
				count: jobs.length,
				offset,
				total,
			});
		},
	)
	.get(
		'cron.appjobs',
		{
			authRequired: true,
			query: isCronJobsListParams,
			response: {
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { jobs, total } = await CronJobsSvc.getAppJobs({ offset, count });

			return API.v1.success({
				jobs,
				count: jobs.length,
				offset,
				total,
			});
		},
	)
	.get(
		'cron.history',
		{
			authRequired: true,
			query: isCronJobsHistoryParams,
			response: {
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { jobName } = this.queryParams;
			const { history, total } = await CronJobsSvc.getHistory(jobName, { offset, count });

			return API.v1.success({
				history,
				count: history.length,
				offset,
				total,
			});
		},
	)
	.post(
		'cron.enable',
		{
			authRequired: true,
			body: isCronJobsActionParams,
			response: {
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { jobName } = this.bodyParams;
			const success = await CronJobsSvc.enable(jobName);

			if (!success) {
				return API.v1.failure('error-job-not-found');
			}
			return API.v1.success();
		},
	)
	.post(
		'cron.disable',
		{
			authRequired: true,
			body: isCronJobsActionParams,
			response: {
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { jobName } = this.bodyParams;
			const success = await CronJobsSvc.disable(jobName);

			if (!success) {
				return API.v1.failure('error-job-not-found');
			}
			return API.v1.success();
		},
	);

export type CronJobsEndpoints = ExtractRoutesFromAPI<typeof cronJobsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CronJobsEndpoints {}
}
