import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../../authorization/server';
import { API } from '../../../../api/server';
import { findRooms } from '../../../server/api/lib/rooms';
import { typedJsonParse } from '../../../../../lib/typedJsonParse';

type DateParam = { start?: string; end?: string };

const validateDateParams = (property: string, date: DateParam | string): DateParam => {
	const parsedDate = date && typeof date === 'string' ? typedJsonParse<DateParam>(date) : {};

	if (parsedDate?.start && isNaN(Date.parse(parsedDate.start))) {
		throw new Error(`The "${property}.start" query parameter must be a valid date.`);
	}
	if (parsedDate?.end && isNaN(Date.parse(parsedDate.end))) {
		throw new Error(`The "${property}.end" query parameter must be a valid date.`);
	}
	return parsedDate;
};

API.v1.addRoute(
	'livechat/rooms',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();
			const {
				agents,
				departmentId,
				open,
				tags,
				roomName,
				onhold,
				createdAt: createdAtParam,
				closedAt: closedAtParam,
			} = this.requestParams();
			let { customFields } = this.requestParams();

			check(agents, Match.Maybe([String]));
			check(roomName, Match.Maybe(String));
			check(departmentId, Match.Maybe(String));
			check(open, Match.Maybe(String));
			check(onhold, Match.Maybe(String));
			check(tags, Match.Maybe([String]));

			const hasAdminAccess = hasPermission(this.userId, 'view-livechat-rooms');
			const hasAgentAccess = hasPermission(this.userId, 'view-l-room') && agents?.includes(this.userId) && agents?.length === 1;
			if (!hasAdminAccess && !hasAgentAccess) {
				return API.v1.unauthorized();
			}

			const createdAt = validateDateParams('createdAt', createdAtParam);
			const closedAt = validateDateParams('closedAt', closedAtParam);

			if (customFields) {
				customFields = JSON.parse(customFields);
			}

			return API.v1.success(
				await findRooms({
					agents,
					roomName,
					departmentId,
					open: open && open === 'true',
					createdAt,
					closedAt,
					tags,
					customFields,
					onhold,
					options: { offset, count, sort, fields },
				}),
			);
		},
	},
);
