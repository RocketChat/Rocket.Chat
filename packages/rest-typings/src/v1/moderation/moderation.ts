import type { IModerationAudit, IModerationReport, IUser, MessageReport } from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ArchiveReportPropsPOST } from './ArchiveReportProps';
import type { ModerationDeleteMsgHistoryParamsPOST } from './ModerationDeleteMsgHistoryParams';
import type { ModerationReportUserPOST } from './ModerationReportUserPOST';
import type { ReportHistoryPropsGET } from './ReportHistoryProps';
import type { ReportInfoParams } from './ReportInfoParams';
import type { ReportMessageHistoryParamsGET } from './ReportMessageHistoryParams';
import type { ReportsByMsgIdParamsGET } from './ReportsByMsgIdParams';

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
	'/v1/moderation.user.reportedMessages': {
		GET: (params: ReportMessageHistoryParamsGET) => PaginatedResult<{
			user: Pick<IUser, 'username' | 'name' | '_id'> | null;
			messages: Pick<MessageReport, 'message' | 'ts' | 'room' | '_id'>[];
		}>;
	};
	'/v1/moderation.user.deleteReportedMessages': {
		POST: (params: ModerationDeleteMsgHistoryParamsPOST) => void;
	};
	'/v1/moderation.dismissReports': {
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
