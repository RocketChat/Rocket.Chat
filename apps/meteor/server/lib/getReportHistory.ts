import type { IReport } from '@rocket.chat/core-typings';
import type { FindPaginated } from '@rocket.chat/model-typings';
import { Reports } from '@rocket.chat/models';
import type { ReportHistoryProps } from '@rocket.chat/rest-typings';
import type { FindCursor } from 'mongodb';
import _ from 'underscore';

export const getReportHistory = (params: ReportHistoryProps): FindPaginated<FindCursor<IReport>> => {
	const { latest, oldest, count } = params;

	const query: Record<string, any> = {};

	if (latest) {
		query._id = { $lt: latest };
	}

	if (oldest) {
		query._id = { $gt: oldest };
	}

	const reports = oldest === undefined ?
		? Reports.findReportsBetweenDates(query._id.$gt, query._id.$lt, count)
			: Reports.findReportsAfterDate(query._id.$lt, undefined, count);

	return reports;
};
