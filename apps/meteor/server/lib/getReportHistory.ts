import type { IReport } from '@rocket.chat/core-typings';
import type { ReportHistoryProps } from '@rocket.chat/rest-typings';
import { Reports } from '/app/models/server';
import _ from 'underscore';

export const getReportHistory = (params: ReportHistoryProps): Array<IReport> => {
	const { latest, oldest, count } = params;

	const query: Record<string, any> = {};

	if (latest) {
		query._id = { $lt: latest };
	}

	if (oldest) {
		query._id = { $gt: oldest };
	}

	const reports = _.isUndefined(oldest)
		? Reports.findReportsBetweenDates(query._id.$gt, query._id.$lt, count)
		: Reports.findReportsAfterDate(query._id.$lt, undefined, count);

	return reports;
};
