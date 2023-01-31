import type { IReport } from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ArchiveReportProps } from './ArchiveReportProps';
import type { ReportHistoryProps } from './ReportHistoryProps';

export type ModerationEndpoints = {
	// API endpoint to fetch the reported messages
	'/v1/moderation.getReports': {
		GET: (params: ReportHistoryProps) => PaginatedResult<{
			reports: IReport[];
		}>;
	};
	'/v1/moderation.markChecked': {
		POST: (params: ArchiveReportProps) => {
			report: IReport | null;
		};
	};
	'/v1/moderation.info': {
		GET: (params: { msgId: string }) => PaginatedResult<{
			reports: IReport[];
		}>;
	};
};
