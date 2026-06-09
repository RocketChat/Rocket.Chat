import { CronJobsSvc } from '@rocket.chat/core-services';
import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import { ajv, ajvQuery, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

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

const isCronJobsListResponse = ajv.compile<{ jobs: ICronJobItem[]; count: number; offset: number; total: number; success: boolean }>({
	type: 'object',
	properties: {
		jobs: { type: 'array' },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['jobs', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const isCronJobsHistoryResponse = ajv.compile<{
	history: ICronHistoryItem[];
	count: number;
	offset: number;
	total: number;
	success: boolean;
}>({
	type: 'object',
	properties: {
		history: { type: 'array' },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['history', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const isCronJobsActionResponse = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const cronJobsEndpoints = API.v1
	.get(
		'cron.jobs',
		{
			authRequired: true,
			permissionsRequired: ['manage-scheduled-jobs'],
			query: isCronJobsListParams,
			response: {
				200: isCronJobsListResponse,
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
			permissionsRequired: ['manage-scheduled-jobs'],
			query: isCronJobsListParams,
			response: {
				200: isCronJobsListResponse,
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
			permissionsRequired: ['manage-scheduled-jobs'],
			query: isCronJobsHistoryParams,
			response: {
				200: isCronJobsHistoryResponse,
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
			permissionsRequired: ['manage-scheduled-jobs'],
			body: isCronJobsActionParams,
			response: {
				200: isCronJobsActionResponse,
				400: validateBadRequestErrorResponse,
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
			permissionsRequired: ['manage-scheduled-jobs'],
			body: isCronJobsActionParams,
			response: {
				200: isCronJobsActionResponse,
				400: validateBadRequestErrorResponse,
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
	)
	.post(
		'cron.trigger',
		{
			authRequired: true,
			permissionsRequired: ['manage-scheduled-jobs'],
			body: isCronJobsActionParams,
			response: {
				200: isCronJobsActionResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { jobName } = this.bodyParams;
			const success = await CronJobsSvc.trigger(jobName);

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
