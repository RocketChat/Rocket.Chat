import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../../authorization/server';
import { API } from '../../../../api/server';
import { findRooms } from '../../../server/api/lib/rooms';
import { parseAndValidate } from '../../../lib/parseAndValidate';

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
			check(agents, Match.Maybe([String]));
			check(departmentId, Match.Maybe(String));

			const hasAdminAccess = hasPermission(this.userId, 'view-livechat-rooms');
			const hasAgentAccess = hasPermission(this.userId, 'view-l-room') && agents?.includes(this.userId) && agents?.length === 1;
			if (!hasAdminAccess && !hasAgentAccess) {
				return API.v1.unauthorized();
			}

			const createdAt = parseAndValidate('createdAt', createdAtParam);
			const closedAt = parseAndValidate('closedAt', closedAtParam);

			if (customFields) {
				customFields = JSON.parse(customFields);
			}

			return API.v1.success(
				await findRooms({
					agents,
					roomName,
					departmentId,
					open: open !== undefined ? open === 'true' : undefined,
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
