import type { IUser, IUserEmail } from '@rocket.chat/core-typings';
import { ModerationReports, Users } from '@rocket.chat/models';
import type { GetUserReportsParamsGET } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { getPaginationItems } from '../../../app/api/server/helpers/getPaginationItems';
import type { ParseJsonQuery } from './definitions';

export const getUserReportsByUid = async (queryParams: GetUserReportsParamsGET, parseJsonQuery: ParseJsonQuery) => {
	const { userId, selector = '' } = queryParams;
	const { sort } = await parseJsonQuery();
	const { count = 50, offset = 0 } = await getPaginationItems(queryParams);

	const user = await Users.findOneById<IUser>(userId, {
		projection: {
			_id: 1,
			username: 1,
			name: 1,
			avatarETag: 1,
			active: 1,
			roles: 1,
			emails: 1,
			createdAt: 1,
		},
	});

	const escapedSelector = escapeRegExp(selector);
	const { cursor, totalCount } = ModerationReports.findUserReportsByReportedUserId(userId, escapedSelector, {
		offset,
		count,
		sort,
	});

	const [reports, total] = await Promise.all([cursor.toArray(), totalCount]);

	const emailSet = new Map<IUserEmail['address'], IUserEmail>();

	reports.flatMap((report) => report.reportedUser?.emails ?? []).forEach((email) => emailSet.set(email.address, email));

	if (user) {
		user.emails = Array.from(emailSet.values());
	}

	return {
		user,
		reports,
		count: reports.length,
		total,
		offset,
	};
};
