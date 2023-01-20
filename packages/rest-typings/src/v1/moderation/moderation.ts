import type { IReport } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ReportHistoryProps } from './ReportHistoryProps';

export type ModerationEndpoints = {
	// API endpoint to fetch the reported messages
	'/v1/moderation.history': {
		GET: (params: ReportHistoryProps) => PaginatedResult<{
			reports: IReport[];
		}>;
	};
};
