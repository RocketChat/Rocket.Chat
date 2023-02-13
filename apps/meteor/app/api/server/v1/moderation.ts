import { isReportHistoryProps, isArchiveReportProps } from '@rocket.chat/rest-typings';
import { Reports } from '@rocket.chat/models';

import { API } from '../api';

API.v1.addRoute(
	'moderation.getReports',
	{
		authRequired: true,
		validateParams: isReportHistoryProps,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { latest, oldest, selector } = this.queryParams;

			const { count = 20, offset = 0 } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const cursor = oldest
				? Reports.findReportsBetweenDates(latest ? new Date(latest) : new Date(), new Date(oldest), offset, count, sort, selector)
				: Reports.findReportsBeforeDate(latest ? new Date(latest) : new Date(), offset, count, sort, selector);

			const [reports] = await Promise.all([cursor.toArray()]);

			const total = await Reports.countGroupedReports(latest ? new Date(latest) : new Date(), oldest && new Date(oldest), selector);

			return API.v1.success({
				reports,
				count: reports.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'moderation.markChecked',
	{
		authRequired: true,
		validateParams: isArchiveReportProps,
		hasPermission: 'manage-moderation-actions',
	},
	{
		async post() {
			const { reportId } = this.requestParams();

			const { userId } = this;

			const reportDoc = await Reports.findOneById(reportId);

			if (!reportDoc) {
				return API.v1.failure('Report not found');
			}

			if (reportDoc._hidden) {
				return API.v1.failure('Report is already hidden');
			}

			const update = await Reports.hideReportById(reportId, userId);

			const report = await Reports.findOneById(reportId);

			return API.v1.success({ report, update });
		},
	},
);

API.v1.addRoute(
	'moderation.reportsByMessage',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { msgId } = this.queryParams;

			const { count = 20, offset = 0 } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { selector } = this.queryParams;

			if (!msgId) {
				return API.v1.failure('The required "msgId" query param is missing.');
			}

			const reports = await Reports.findReportsByMessageId(msgId, offset, count, sort, selector);

			return API.v1.success({
				reports,
				count: reports.length,
				offset,
				total: reports.length || 0,
			});
		},
	},
);

// api endoint to get details about a single report

API.v1.addRoute(
	'moderation.getReportInfo',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { reportId } = this.queryParams;

			if (!reportId) {
				return API.v1.failure('The required "reportId" query param is missing.');
			}

			const report = await Reports.findOneById(reportId);

			if (!report) {
				return API.v1.failure('Report not found');
			}

			return API.v1.success({ report });
		},
	},
);

// api endpoint to get counts of reports by msgId

API.v1.addRoute(
	'moderation.countReportsByMsgId',
	{
		authRequired: true,
		pemissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { msgId } = this.queryParams;
			const { count } = this.getPaginationItems();

			if (!msgId) {
				return API.v1.failure('The required "msgId" query param is missing.');
			}

			const reportCounts = await Reports.countReportsByMessageId(msgId, count);

			return API.v1.success({ reportCounts, count });
		},
	},
);
