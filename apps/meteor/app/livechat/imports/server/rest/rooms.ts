import { LivechatRooms } from '@rocket.chat/models';
import { isGETLivechatRoomsParams } from '@rocket.chat/rest-typings';
import moment from 'moment';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { findRooms } from '../../../server/api/lib/rooms';

const validateDateParams = (property: string, utcOffset?: number, date?: string) => {
	let parsedDateStr: { start?: string; end?: string } | undefined = undefined;
	if (date) {
		parsedDateStr = JSON.parse(date) as { start?: string; end?: string };
	}

	if (parsedDateStr?.start && isNaN(Date.parse(parsedDateStr.start))) {
		throw new Error(`The "${property}.start" query parameter must be a valid date.`);
	}
	if (parsedDateStr?.end && isNaN(Date.parse(parsedDateStr.end))) {
		throw new Error(`The "${property}.end" query parameter must be a valid date.`);
	}

	if (!parsedDateStr?.start && !parsedDateStr?.end) {
		return undefined;
	}

	const parsedDate: { start?: Date; end?: Date } = {};
	if (parsedDateStr?.start) {
		const start = moment(parsedDateStr.start);
		if (utcOffset !== undefined) {
			start.utcOffset(utcOffset, true);
		}
		parsedDate.start = start.toDate();
	}
	if (parsedDateStr?.end) {
		const end = moment(parsedDateStr.end);
		if (utcOffset !== undefined) {
			end.utcOffset(utcOffset, true);
		}
		parsedDate.end = end.toDate();
	}

	return parsedDate;
};

const isBoolean = (value?: string | boolean): boolean => value === 'true' || value === 'false' || typeof value === 'boolean';

API.v1.addRoute(
	'livechat/rooms',
	{ authRequired: true, validateParams: isGETLivechatRoomsParams },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields } = await this.parseJsonQuery();
			const { agents, departmentId, open, tags, roomName, onhold } = this.queryParams;
			const { createdAt, customFields, closedAt } = this.queryParams;

			const createdAtParam = validateDateParams('createdAt', this.user.utcOffset, createdAt);
			const closedAtParam = validateDateParams('closedAt', this.user.utcOffset, closedAt);

			const hasAdminAccess = await hasPermissionAsync(this.userId, 'view-livechat-rooms');
			const hasAgentAccess =
				(await hasPermissionAsync(this.userId, 'view-l-room')) && agents?.includes(this.userId) && agents?.length === 1;
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
