import { isReportHistoryProps, isArchiveReportProps } from '@rocket.chat/rest-typings';
import { Reports } from '@rocket.chat/models';

import { API } from '../api';
import { deleteReportedMessages } from '../../../../server/lib/moderation/deleteReportedMessages';

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

			const total = await Reports.countGroupedReports(
				latest ? new Date(latest) : new Date(),
				oldest ? new Date(oldest) : undefined,
				selector,
			);

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
	'moderation.user.getMessageHistory',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { userId } = this.queryParams;

			const { sort } = this.parseJsonQuery();

			const { count: pagCount = 50, offset = 0 } = this.getPaginationItems();

			if (!userId) {
				return API.v1.failure('The required "userId" query param is missing.');
			}

			const cursor = Reports.findUserMessages(userId, offset, pagCount, sort);

			const [{ messages = [], count = 0 } = {}] = await cursor.toArray();

			return API.v1.success({
				messages,
				count,
			});
		},
	},
);

API.v1.addRoute(
	'moderation.user.deleteMessageHistory',
	{
		authRequired: true,
		permissionsRequired: ['manage-moderation-actions'],
	},
	{
		async post() {
			const { userId, reasonForHiding } = this.requestParams();

			const reasonProvided = reasonForHiding && reasonForHiding.trim() !== '';
			const sanitizedReason = reasonProvided ? reasonForHiding : 'No reason provided';

			const { user: modUser } = this;

			if (!userId) {
				return API.v1.failure('The required "userId" body param is missing.');
			}

			const cursor = Reports.findUserMessages(userId);

			const [{ messages = [], count = 0 } = {}] = await cursor.toArray();

			if (count < 0) {
				return API.v1.failure('No messages found for this user.');
			}

			await deleteReportedMessages(messages, modUser);

			await Reports.hideReportsByUserId(userId, this.userId, sanitizedReason, 'DELETE Messages');

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'moderation.markChecked',
	{
		authRequired: true,
		validateParams: isArchiveReportProps,
		permissionsRequired: ['manage-moderation-actions'],
	},
	{
		async post() {
			const { userId, msgId, reasonForHiding, actionTaken } = this.requestParams();

			// check if at least one of the required params is present

			if (!userId || !msgId) {
				return API.v1.failure('The required "userId" or "msgId" body param is missing.');
			}

			const reasonProvided = reasonForHiding && reasonForHiding.trim() !== '';
			const sanitizedReason = reasonProvided ? reasonForHiding : 'No reason provided';
			const action = actionTaken || 'None';

			const { userId: modId } = this;

			const update = userId
				? await Reports.hideReportsByUserId(userId, modId, sanitizedReason, action)
				: await Reports.hideReportsByMessageId(msgId, modId, sanitizedReason, action);

			return API.v1.success({ update });
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

			const { count = 50, offset = 0 } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { selector } = this.queryParams;

			if (!msgId) {
				return API.v1.failure('The required "msgId" query param is missing.');
			}

			const cursor = await Reports.findReportsByMessageId(msgId, offset, count, sort, selector);

			const reports = await cursor.toArray();

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
