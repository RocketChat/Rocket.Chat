import type { IAuditServerActor } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';
import { isServerEventsAuditSettingsProps } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'audit.settings',
	{ authRequired: true, validateParams: isServerEventsAuditSettingsProps /* , permissionsRequired: ['can-audit'] */ },
	{
		async get() {
			const { start, end, sort } = await this.queryParams;

			if (start && isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (end && isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const filter: { actor?: Partial<IAuditServerActor>; settingId?: string } = {};
			if (typeof this.queryParams.filter === 'string') {
				try {
					const parsed = JSON.parse(this.queryParams.filter) as typeof filter;

					if (typeof parsed !== 'object') {
						throw new Error();
					}

					if ('actor' in parsed && typeof parsed.actor === 'object') {
						filter.actor = parsed.actor as Partial<IAuditServerActor>;
					}

					if ('settingId' in parsed && typeof parsed.settingId === 'string') {
						filter.settingId = parsed.settingId;
					}
				} catch (error) {
					return API.v1.failure('Parameter "filter" is not valid JSON');
				}
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const _sort = { ts: sort?.ts ? sort.ts : -1 };

			const { actor, settingId } = filter;

			const filterActor = actor || {};
			const filterSettingId = settingId
				? {
						'data.key': 'id',
						'data.value': settingId,
					}
				: {};

			const { cursor, totalCount } = ServerEvents.findPaginated(
				{
					...filterActor,
					...filterSettingId,
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
