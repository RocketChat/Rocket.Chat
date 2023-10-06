import type { IModerationReport, IUser } from '@rocket.chat/core-typings';
import { ModerationReports, Users } from '@rocket.chat/models';
import {
	isReportHistoryProps,
	isArchiveReportProps,
	isReportInfoParams,
	isReportMessageHistoryParams,
	isModerationReportUserPost,
	isModerationDeleteMsgHistoryParams,
	isReportsByMsgIdParams,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { deleteReportedMessages } from '../../../../server/lib/moderation/deleteReportedMessages';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type ReportMessage = Pick<IModerationReport, '_id' | 'message' | 'ts' | 'room'>;

API.v1.addRoute(
	'moderation.reportsByUsers',
	{
		authRequired: true,
		validateParams: isReportHistoryProps,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { latest: _latest, oldest: _oldest, selector = '' } = this.queryParams;

			const { count = 20, offset = 0 } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const latest = _latest ? new Date(_latest) : new Date();
			const oldest = _oldest ? new Date(_oldest) : new Date(0);

			const escapedSelector = escapeRegExp(selector);

			const reports = await ModerationReports.findMessageReportsGroupedByUser(latest, oldest, escapedSelector, {
				offset,
				count,
				sort,
			}).toArray();

			if (reports.length === 0) {
				return API.v1.success({
					reports,
					count: 0,
					offset,
					total: 0,
				});
			}

			const total = await ModerationReports.countMessageReportsInRange(latest, oldest, escapedSelector);

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
	'moderation.user.reportedMessages',
	{
		authRequired: true,
		validateParams: isReportMessageHistoryParams,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { userId, selector = '' } = this.queryParams;

			const { sort } = await this.parseJsonQuery();

			const { count = 50, offset = 0 } = await getPaginationItems(this.queryParams);

			const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(userId, {
				projection: { _id: 1, username: 1, name: 1 },
			});

			const escapedSelector = escapeRegExp(selector);

			const { cursor, totalCount } = ModerationReports.findReportedMessagesByReportedUserId(userId, escapedSelector, {
				offset,
				count,
				sort,
			});

			const [reports, total] = await Promise.all([cursor.toArray(), totalCount]);

			const uniqueMessages: ReportMessage[] = [];
			const visited = new Set<string>();
			for (const report of reports) {
				if (visited.has(report.message._id)) {
					continue;
				}
				visited.add(report.message._id);
				uniqueMessages.push(report);
			}

			return API.v1.success({
				user,
				messages: uniqueMessages,
				count: reports.length,
				total,
				offset,
			});
		},
	},
);

API.v1.addRoute(
	'moderation.user.deleteReportedMessages',
	{
		authRequired: true,
		validateParams: isModerationDeleteMsgHistoryParams,
		permissionsRequired: ['manage-moderation-actions'],
	},
	{
		async post() {
			// TODO change complicated params
			const { userId, reason } = this.bodyParams;

			const sanitizedReason = reason?.trim() ? reason : 'No reason provided';

			const { user: moderator } = this;

			const { count = 50, offset = 0 } = await getPaginationItems(this.queryParams);

			const { cursor, totalCount } = ModerationReports.findReportedMessagesByReportedUserId(userId, '', {
				offset,
				count,
				sort: { ts: -1 },
			});

			const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

			if (total === 0) {
				return API.v1.failure('No reported messages found for this user.');
			}

			await deleteReportedMessages(
				messages.map((message) => message.message),
				moderator,
			);

			await ModerationReports.hideMessageReportsByUserId(userId, this.userId, sanitizedReason, 'DELETE Messages');

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'moderation.dismissReports',
	{
		authRequired: true,
		validateParams: isArchiveReportProps,
		permissionsRequired: ['manage-moderation-actions'],
	},
	{
		async post() {
			const { userId, msgId, reason, action: actionParam } = this.bodyParams;

			if (userId) {
				const report = await ModerationReports.findOne({ 'message.u._id': userId, '_hidden': { $ne: true } }, { projection: { _id: 1 } });
				if (!report) {
					return API.v1.failure('no-reports-found');
				}
			}

			if (msgId) {
				const report = await ModerationReports.findOne({ 'message._id': msgId, '_hidden': { $ne: true } }, { projection: { _id: 1 } });
				if (!report) {
					return API.v1.failure('no-reports-found');
				}
			}

			const sanitizedReason: string = reason?.trim() ? reason : 'No reason provided';
			const action: string = actionParam ?? 'None';

			const { userId: moderatorId } = this;

			if (userId) {
				await ModerationReports.hideMessageReportsByUserId(userId, moderatorId, sanitizedReason, action);
			} else {
				await ModerationReports.hideMessageReportsByMessageId(msgId as string, moderatorId, sanitizedReason, action);
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'moderation.reports',
	{
		authRequired: true,
		validateParams: isReportsByMsgIdParams,
		permissionsRequired: ['view-moderation-console'],
	},
	{
		async get() {
			const { msgId } = this.queryParams;

			const { count = 50, offset = 0 } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { selector = '' } = this.queryParams;

			const escapedSelector = escapeRegExp(selector);

			const { cursor, totalCount } = ModerationReports.findReportsByMessageId(msgId, escapedSelector, { count, sort, offset });

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

API.v1.addRoute(
	'moderation.reportInfo',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
		validateParams: isReportInfoParams,
	},
	{
		async get() {
			const { reportId } = this.queryParams;

			const report = await ModerationReports.findOneById(reportId);

			if (!report) {
				return API.v1.failure('error-report-not-found');
			}

			return API.v1.success({ report });
		},
	},
);

API.v1.addRoute(
	'moderation.reportUser',
	{
		authRequired: true,
		validateParams: isModerationReportUserPost,
	},
	{
		async post() {
			const { userId, description } = this.bodyParams;

			const {
				user: { _id, name, username, createdAt },
			} = this;

			const reportedUser = await Users.findOneById(userId, { projection: { _id: 1, name: 1, username: 1, emails: 1, createdAt: 1 } });

			if (!reportedUser) {
				return API.v1.failure('Invalid user id provided.');
			}

			await ModerationReports.createWithDescriptionAndUser(reportedUser, description, { _id, name, username, createdAt });

			return API.v1.success();
		},
	},
);
