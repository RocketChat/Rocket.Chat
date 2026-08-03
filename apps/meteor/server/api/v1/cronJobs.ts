import { CronJobs } from '@rocket.chat/core-services';
import type { CronJobStatus, ICronJobItem, ICronHistoryItem, OmnichannelJobSource } from '@rocket.chat/core-typings';
import { ajv, ajvQuery, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../lib/getPaginationItems';

const isCronJobsListParams = ajvQuery.compile<{
	offset?: number;
	count?: number;
	searchTerm?: string;
	status?: CronJobStatus;
}>({
	type: 'object',
	properties: {
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		searchTerm: { type: 'string', nullable: true },
		status: {
			type: 'string',
			enum: ['running', 'scheduled', 'failed', 'disabled'],
			nullable: true,
		},
	},
	additionalProperties: false,
});

const isCronOmnichannelJobsListParams = ajvQuery.compile<{
	source: OmnichannelJobSource;
	offset?: number;
	count?: number;
	searchTerm?: string;
	status?: CronJobStatus;
}>({
	type: 'object',
	properties: {
		source: {
			type: 'string',
			enum: ['auto-close', 'auto-transfer', 'queue-inactivity'],
		},
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		searchTerm: { type: 'string', nullable: true },
		status: {
			type: 'string',
			enum: ['running', 'scheduled', 'failed', 'disabled'],
			nullable: true,
		},
	},
	required: ['source'],
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

const isCronJobResponse = ajv.compile<{ job: ICronJobItem; success: boolean }>({
	type: 'object',
	properties: {
		job: { type: 'object' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['job', 'success'],
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
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const searchTerm = this.queryParams.searchTerm?.trim();
			const { status } = this.queryParams;
			const { jobs, total } = await CronJobs.getCoreJobs({
				offset,
				count,
				...(searchTerm && { searchTerm }),
				...(status && { status }),
			});

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
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const searchTerm = this.queryParams.searchTerm?.trim();
			const { status } = this.queryParams;
			const { jobs, total } = await CronJobs.getAppJobs({
				offset,
				count,
				...(searchTerm && { searchTerm }),
				...(status && { status }),
			});

			return API.v1.success({
				jobs,
				count: jobs.length,
				offset,
				total,
			});
		},
	)
	.get(
		'cron.omnichanneljobs',
		{
			authRequired: true,
			permissionsRequired: ['manage-scheduled-jobs'],
			query: isCronOmnichannelJobsListParams,
			response: {
				200: isCronJobsListResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const searchTerm = this.queryParams.searchTerm?.trim();
			const { source, status } = this.queryParams;
			const { jobs, total } = await CronJobs.getOmnichannelJobs({
				source,
				offset,
				count,
				...(searchTerm && { searchTerm }),
				...(status && { status }),
			});

			return API.v1.success({
				jobs,
				count: jobs.length,
				offset,
				total,
			});
		},
	)
	.get(
		'cron.job',
		{
			authRequired: true,
			permissionsRequired: ['manage-scheduled-jobs'],
			query: isCronJobsActionParams,
			response: {
				200: isCronJobResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { jobName } = this.queryParams;
			const job = await CronJobs.getJob(jobName);

			if (!job) {
				return API.v1.failure('error-job-not-found');
			}

			return API.v1.success({
				job,
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
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { jobName } = this.queryParams;
			const { history, total } = await CronJobs.getHistory(jobName, { offset, count });

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
			const success = await CronJobs.enable(jobName);

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
			const success = await CronJobs.disable(jobName);

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
			const success = await CronJobs.trigger(jobName);

			if (!success) {
				return API.v1.failure('error-job-not-found');
			}

			return API.v1.success();
		},
	);

export type CronJobsEndpoints = ExtractRoutesFromAPI<typeof cronJobsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
	interface Endpoints extends CronJobsEndpoints {}
}
