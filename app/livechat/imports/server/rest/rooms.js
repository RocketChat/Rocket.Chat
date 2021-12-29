import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../../authorization/server';
import { API } from '../../../../api/server';
import { findRooms } from '../../../server/api/lib/rooms';

const validateDateParams = (property, date) => {
	if (date) {
		date = JSON.parse(date);
	}
	if (date && date.start && isNaN(Date.parse(date.start))) {
		throw new Error(`The "${property}.start" query parameter must be a valid date.`);
	}
	if (date && date.end && isNaN(Date.parse(date.end))) {
		throw new Error(`The "${property}.end" query parameter must be a valid date.`);
	}
	return date;
};

API.v1.addRoute(
	'livechat/rooms',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();
			const { agents, departmentId, open, tags, roomName, onhold } = this.requestParams();
			let { createdAt, customFields, closedAt } = this.requestParams();
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

			createdAt = validateDateParams('createdAt', createdAt);
			closedAt = validateDateParams('closedAt', closedAt);

			if (customFields) {
				customFields = JSON.parse(customFields);
			}

			return API.v1.success(
				Promise.await(
					findRooms({
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
				),
			);
		},
	},
);
