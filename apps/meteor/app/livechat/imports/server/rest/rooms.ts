import { isGETLivechatRoomsParams } from '@rocket.chat/rest-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { findRooms } from '../../../server/api/lib/rooms';
import { hasPermission } from '../../../../authorization/server';

const validateDateParams = (property: string, date?: string) => {
	let parsedDate: { start?: string; end?: string } | undefined = undefined;
	if (date) {
		parsedDate = JSON.parse(date) as { start?: string; end?: string };
	}

	if (parsedDate?.start && isNaN(Date.parse(parsedDate.start))) {
		throw new Error(`The "${property}.start" query parameter must be a valid date.`);
	}
	if (parsedDate?.end && isNaN(Date.parse(parsedDate.end))) {
		throw new Error(`The "${property}.end" query parameter must be a valid date.`);
	}
	return parsedDate;
};

const isBoolean = (value?: string | boolean): boolean => value === 'true' || value === 'false' || typeof value === 'boolean';

API.v1.addRoute(
	'livechat/rooms',
	{ authRequired: true, validateParams: isGETLivechatRoomsParams },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();
			const { agents, departmentId, open, tags, roomName, onhold } = this.requestParams();
			const { createdAt, customFields, closedAt } = this.requestParams();

			const createdAtParam = validateDateParams('createdAt', createdAt);
			const closedAtParam = validateDateParams('closedAt', closedAt);

			const hasAdminAccess = hasPermission(this.userId, 'view-livechat-rooms');
			const hasAgentAccess = hasPermission(this.userId, 'view-l-room') && agents?.includes(this.userId) && agents?.length === 1;
			if (!hasAdminAccess && !hasAgentAccess) {
				return API.v1.unauthorized();
			}

			let parsedCf: { [key: string]: string } | undefined = undefined;
			if (customFields) {
				try {
					const parsedCustomFields = JSON.parse(customFields) as { [key: string]: string };
					if (typeof parsedCustomFields !== 'object' || Array.isArray(parsedCustomFields) || parsedCustomFields === null) {
						throw new Error('Invalid custom fields');
					}

					// Model's already checking for the keys, so we don't need to do it here.
					parsedCf = parsedCustomFields;
				} catch (e) {
					throw new Error('The "customFields" query parameter must be a valid JSON.');
				}
			}

			return API.v1.success(
				await findRooms({
					agents,
					roomName,
					departmentId,
					...(isBoolean(open) && { open: open === 'true' }),
					createdAt: createdAtParam,
					closedAt: closedAtParam,
					tags,
					customFields: parsedCf,
					onhold,
					options: { offset, count, sort, fields },
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/rooms/filters',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			return API.v1.success({
				filters: (await LivechatRooms.findAvailableSources().toArray())[0].fullTypes,
			});
		},
	},
);
