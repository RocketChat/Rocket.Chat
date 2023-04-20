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
	'/v1/moderation.getReports': {
		GET: (params: ReportHistoryPropsGET) => PaginatedResult<{
			reports: IModerationAudit[];
			count: number;
			offset: number;
			total: number;
		}>;
	};
	'/v1/moderation.user.getMessageHistory': {
		GET: (params: ReportMessageHistoryParamsGET) => PaginatedResult<{
			messages: Pick<IModerationReport, 'message' | 'ts' | 'room' | '_id'>[];
		}>;
	};
	'/v1/moderation.user.deleteMessageHistory': {
		POST: (params: ModerationDeleteMsgHistoryParamsPOST) => void;
	};
	'/v1/moderation.markChecked': {
		POST: (params: ArchiveReportPropsPOST) => void;
	};
	'/v1/moderation.reportsByMessage': {
		GET: (params: ReportsByMsgIdParamsGET) => PaginatedResult<{
			reports: Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>[];
		}>;
	};
	'/v1/moderation.getReportInfo': {
		GET: (params: ReportInfoParams) => {
			report: IModerationReport | null;
		};
	};
};
