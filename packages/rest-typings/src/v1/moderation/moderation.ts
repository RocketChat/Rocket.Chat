import type { IModerationReport, IModerationAudit } from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ArchiveReportPropsPOST } from './ArchiveReportProps';
import type { ReportHistoryPropsGET } from './ReportHistoryProps';
import type { ReportMessageHistoryParamsGET } from './ReportMessageHistoryParams';
import type { ModerationDeleteMsgHistoryParamsPOST } from './ModerationDeleteMsgHistoryParams';
import type { ReportsByMsgIdParamsGET } from './ReportsByMsgIdParams';
import type { ReportInfoParams } from './ReportInfoParams';

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
			messages: Pick<IModerationReport, 'message' | 'ts' | 'room' | '_id'>[];
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
};
