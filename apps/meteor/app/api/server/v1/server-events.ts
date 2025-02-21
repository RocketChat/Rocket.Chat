import { ServerEvents } from '@rocket.chat/models';
import { isServerEventsAuditSettingsProps } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'audit.settings',
	{ authRequired: true, validateParams: isServerEventsAuditSettingsProps /* , permissionsRequired: ['can-audit'] */ },
	{
		async get() {
			const { start, end, sort, settingId, actor } = this.queryParams;

			if (start && isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (end && isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const _sort = { ts: sort?.ts ? sort.ts : -1 };

			const { cursor, totalCount } = ServerEvents.findPaginated(
				{
					...(settingId && { 'data.key': 'id', 'data.value': settingId }),
					...(actor && { actor }),
					ts: {
						$gte: start ? new Date(start) : new Date(0),
						$lte: end ? new Date(end) : new Date(),
					},
					t: 'settings.changed',
				},
				{
					sort: _sort,
					skip: offset,
					limit: count,
					allowDiskUse: true,
				},
			);

			const [events, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				events,
				count: events.length,
				offset,
				total,
			});
		},
	},
);
