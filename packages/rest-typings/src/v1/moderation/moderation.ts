import type { IModerationAudit, IModerationReport, IUser, MessageReport, UserReport } from '@rocket.chat/core-typings';

import type { ArchiveReportPropsPOST } from './ArchiveReportProps.js';
import type { GetUserReportsParamsGET } from './GetUserReportsParams.js';
import type { ModerationDeleteMsgHistoryParamsPOST } from './ModerationDeleteMsgHistoryParams.js';
import type { ModerationReportUserPOST } from './ModerationReportUserPOST.js';
import type { ReportHistoryPropsGET } from './ReportHistoryProps.js';
import type { ReportInfoParams } from './ReportInfoParams.js';
import type { ReportsByMsgIdParamsGET } from './ReportsByMsgIdParams.js';
import type { PaginatedResult } from '../../helpers/PaginatedResult.js';

export type ModerationEndpoints = {
	// API endpoint to fetch the reported messages
	'/v1/moderation.reportsByUsers': {
		GET: (params: ReportHistoryPropsGET) => PaginatedResult<{
			reports: IModerationAudit[];
			count: number;
			offset: number;
			total: number;
		}>;
	};
	'/v1/moderation.userReports': {
		GET: (params: ReportHistoryPropsGET) => PaginatedResult<{
			reports: (Pick<UserReport, '_id' | 'reportedUser' | 'ts'> & { count: number })[];
			count: number;
			offset: number;
			total: number;
		}>;
	};
	'/v1/moderation.user.reportedMessages': {
		GET: (params: GetUserReportsParamsGET) => PaginatedResult<{
			user: Pick<IUser, 'username' | 'name' | '_id'> | null;
			messages: Pick<MessageReport, 'message' | 'ts' | 'room' | '_id'>[];
		}>;
	};
	'/v1/moderation.user.reportsByUserId': {
		GET: (params: GetUserReportsParamsGET) => PaginatedResult<{
			user: IUser | null;
			reports: Omit<UserReport, 'moderationInfo'>[];
		}>;
	};
	'/v1/moderation.user.deleteReportedMessages': {
		POST: (params: ModerationDeleteMsgHistoryParamsPOST) => void;
	};
	'/v1/moderation.dismissReports': {
		POST: (params: ArchiveReportPropsPOST) => void;
	};
	'/v1/moderation.dismissUserReports': {
		POST: (params: ArchiveReportPropsPOST) => void;
	};
	'/v1/moderation.reports': {
		GET: (params: ReportsByMsgIdParamsGET) => PaginatedResult<{
			reports: Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>[];
		}>;
	};
	'/v1/moderation.reportInfo': {
		GET: (params: ReportInfoParams) => {
			report: IModerationReport | null;
		};
	};
	'/v1/moderation.reportUser': {
		POST: (params: ModerationReportUserPOST) => void;
	};
};
