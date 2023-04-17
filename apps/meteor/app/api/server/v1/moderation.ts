import { isReportHistoryProps, isArchiveReportProps } from '@rocket.chat/rest-typings';
import { ModerationReports, Users, Messages } from '@rocket.chat/models';

import { API } from '../api';
import { deleteReportedMessages } from '../../../../server/lib/moderation/deleteReportedMessages';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'moderation.getReports',
	{
		authRequired: true,
		validateParams: isReportHistoryProps,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { latest, oldest, selector = '' } = this.queryParams;

			const { count = 20, offset = 0 } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const cursor = ModerationReports.findReportsGroupedByUser(
				latest ? new Date(latest) : new Date(),
				oldest ? new Date(oldest) : new Date(0),
				selector,
				{ offset, count, sort },
			);

			const reports = await cursor.toArray();

			// TODO this is wrong
			const total = reports.reduce((total: number, report) => total + report.count, 0);

			return API.v1.success({
				reports,
				count: reports.length,
				offset,
				total,
			});
		},
	},
);

// TODO add ajv validation
API.v1.addRoute(
	'moderation.user.getMessageHistory',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { userId } = this.queryParams;

			const { sort } = await this.parseJsonQuery();

			const { count = 50, offset = 0 } = await getPaginationItems(this.queryParams);

			const user = await Users.findOneById(userId as string, { projection: { _id: 1 } });
			if (!user) {
				return API.v1.failure('error-invalid-user');
			}

			const { cursor, totalCount } = ModerationReports.findUserMessages(userId as string, '', { offset, count, sort });

			const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				messages,
				count: messages.length,
				total,
				offset,
			});
		},
	},
);

// TODO add ajv validation
API.v1.addRoute(
	'moderation.user.deleteMessageHistory',
	{
		authRequired: true,
		permissionsRequired: ['manage-moderation-actions'],
	},
	{
		async post() {
			// TODO change complicated params
			const { userId, reasonForHiding } = this.bodyParams;

			const sanitizedReason = reasonForHiding?.trim() ? reasonForHiding : 'No reason provided';

			const { user: moderator } = this;

			const { count = 50, offset = 0 } = await getPaginationItems(this.queryParams);

			const user = await Users.findOneById(userId as string, { projection: { _id: 1 } });
			if (!user) {
				return API.v1.failure('error-invalid-user');
			}

			const { cursor, totalCount } = ModerationReports.findUserMessages(userId as string, '', { offset, count, sort: { ts: -1 }});

			const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

			// TODO check this
			if (total < 0) {
				return API.v1.failure('No messages found for this user.');
			}

			// TODO optimize
			await deleteReportedMessages(messages, moderator);

			await ModerationReports.hideReportsByUserId(userId as string, this.userId, sanitizedReason, 'DELETE Messages');

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
			// TODO change complicated camelcases to simple verbs/nouns
			const { userId, msgId, reasonForHiding, actionTaken } = this.bodyParams;

			if (userId) {
				const user = await Users.findOneById(userId, { projection: { _id: 1 } });
				if (!user) {
					return API.v1.failure('user-not-found');
				}
			}

			if (msgId) {
				const message = await Messages.findOneById(msgId, { projection: { _id: 1 } });
				if (!message) {
					return API.v1.failure('error-message-not-found');
				}
			}

			const sanitizedReason: string = reasonForHiding?.trim() ? reasonForHiding : 'No reason provided';
			const action: string = actionTaken ?? 'None';

			const { userId: moderatorId } = this;

			if (userId) {
				await ModerationReports.hideReportsByUserId(userId, moderatorId, sanitizedReason, action);
			} else {
				await ModerationReports.hideReportsByMessageId(msgId as string, moderatorId, sanitizedReason, action);
			}

			return API.v1.success();
		},
	},
);

// TODO add ajv validation
API.v1.addRoute(
	'moderation.reportsByMessage',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { msgId } = this.queryParams;

			const { count = 50, offset = 0 } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { selector = '' } = this.queryParams;

			const { cursor, totalCount } = ModerationReports.findReportsByMessageId(msgId as string, selector, { count, sort, offset });

			const [reports, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				reports,
				count: reports.length,
				offset,
				total,
			});
		},
	},
);

// TODO add validation
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
				return API.v1.failure('"reportId" is a required parameter');
			}

			const report = await ModerationReports.findOneById(reportId);

			if (!report) {
				return API.v1.failure('error-report-not-found');
			}

			return API.v1.success({ report });
		},
	},
);
