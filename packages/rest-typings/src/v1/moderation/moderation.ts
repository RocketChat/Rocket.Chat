import type { IReport, IModerationAudit, IUserReportedMessages } from '@rocket.chat/core-typings';
import type { UpdateResult, Document } from 'mongodb';

import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ArchiveReportProps } from './ArchiveReportProps';
import type { ReportHistoryProps } from './ReportHistoryProps';

export type ModerationEndpoints = {
	// API endpoint to fetch the reported messages
	'/v1/moderation.getReports': {
		GET: (params: ReportHistoryProps) => PaginatedResult<{
			reports: IModerationAudit[];
			count: number;
			offset: number;
			total: number;
		}>;
	};
	'/v1/moderation.user.getMessageHistory': {
		GET: (params: { userId: string; sort?: string; selector?: string; count?: number }) => IUserReportedMessages;
	};
	'/v1/moderation.markChecked': {
		POST: (params: ArchiveReportProps) => {
			update: Document | UpdateResult;
		};
	};
	'/v1/moderation.reportsByMessage': {
		GET: (params: { msgId: string; sort?: string; selector?: string; count?: number }) => {
			reports: IUserReportedMessages[];
		};
	};
	'/v1/moderation.getReportInfo': {
		GET: (params: { reportId: string }) => {
			report: IReport | null;
		};
	};
	'/v1/moderation.countReportsByMsgId': {
		GET: (params: { msgId: string; count?: number }) => {
			count: number;
			reportCounts: number;
		};
	};
};
