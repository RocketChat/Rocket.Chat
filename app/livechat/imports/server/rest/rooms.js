import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../../authorization/server';
import { API } from '../../../../api';
import { findRooms } from '../../../server/api/lib/livechat';

API.v1.addRoute('livechat/rooms', { authRequired: true }, {
	get() {
		try {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();
			const { agents, departmentId, open, tags } = this.requestParams();
			let { createdAt, customFields, closedAt } = this.requestParams();
			check(agents, Match.Maybe([String]));
			check(departmentId, Match.Maybe(String));
			check(open, Match.Maybe(String));
			check(tags, Match.Maybe([String]));
			if (createdAt) {
				createdAt = JSON.parse(createdAt);
			}
			if (closedAt) {
				closedAt = JSON.parse(closedAt);
			}
			if (customFields) {
				customFields = JSON.parse(customFields);
			}
			const { rooms, total } = findRooms({
				agents,
				departmentId,
				open: open && open === 'true',
				createdAt,
				closedAt,
				tags,
				customFields,
				options: { offset, count, sort, fields },
			});

			return API.v1.success({
				rooms,
				count: rooms.length,
				offset,
				total,
			});
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
