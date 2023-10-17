import { ModerationReports } from '@rocket.chat/models';
import type { ReportHistoryPropsGET } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { getPaginationItems } from '../../../app/api/server/helpers/getPaginationItems';
import type { ParseJsonQuery } from './definitions';

export const getUserReports = async (queryParams: ReportHistoryPropsGET, parseJsonQuery: ParseJsonQuery) => {
	try {
		const { latest: _latest, oldest: _oldest, selector = '' } = queryParams;

		const { count = 20, offset = 0 } = await getPaginationItems(queryParams);

		const { sort } = await parseJsonQuery();

		const latest = _latest ? new Date(_latest) : new Date();

		const oldest = _oldest ? new Date(_oldest) : new Date(0);

		const escapedSelector = escapeRegExp(selector);

		const reports = await ModerationReports.findUserReports(latest, oldest, escapedSelector, {
			offset,
			count,
			sort,
		}).toArray();

		if (reports.length === 0) {
			return {
				reports,
				count: 0,
				offset,
				total: 0,
			};
		}

		const total = await ModerationReports.countUserReportsInRange(latest, oldest, escapedSelector);

		return {
			reports,
			count: reports.length,
			offset,
			total,
		};
	} catch (error) {
		throw new Error('Error while fetching user reports');
	}
};
