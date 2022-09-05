import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { findRooms } from '../../../server/api/lib/rooms';
import { hasPermission } from '../../../../authorization/server';

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
		async get() {
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
			check(customFields, Match.Maybe(String));

			createdAt = validateDateParams('createdAt', createdAt);
			closedAt = validateDateParams('closedAt', closedAt);

			const hasAdminAccess = hasPermission(this.userId, 'view-livechat-rooms');
			const hasAgentAccess = hasPermission(this.userId, 'view-l-room') && agents?.includes(this.userId) && agents?.length === 1;
			if (!hasAdminAccess && !hasAgentAccess) {
				return API.v1.unauthorized();
			}

			if (customFields) {
				try {
					const parsedCustomFields = JSON.parse(customFields);
					check(parsedCustomFields, Object);
					// Model's already checking for the keys, so we don't need to do it here.
					customFields = parsedCustomFields;
				} catch (e) {
					throw new Error('The "customFields" query parameter must be a valid JSON.');
				}
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
