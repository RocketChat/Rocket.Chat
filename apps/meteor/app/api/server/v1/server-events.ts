import { ServerEvents } from '@rocket.chat/models';
import { isServerEventsAuditSettingsProps } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.get(
	'audit.settings',
	{
		response: {
			200: ajv.compile({
				additionalProperties: false,
				type: 'object',
				properties: {
					events: {
						type: 'array',
						items: {
							type: 'object',
						},
					},
					count: {
						type: 'number',
						description: 'The number of events returned in this response.',
					},
					offset: {
						type: 'number',
						description: 'The number of events that were skipped in this response.',
					},
					total: {
						type: 'number',
						description: 'The total number of events that match the query.',
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['events', 'count', 'offset', 'total', 'success'],
			}),
			400: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [false],
					},
					error: {
						type: 'string',
					},
					errorType: {
						type: 'string',
					},
				},
				required: ['success', 'error'],
			}),
		},
		query: isServerEventsAuditSettingsProps,
		authRequired: true,
		permissionsRequired: ['can-audit'],
	},
	async function action() {
		const { start, end, settingId, actor } = this.queryParams;

		if (start && isNaN(Date.parse(start as string))) {
			return API.v1.failure('The "start" query parameter must be a valid date.');
		}

		if (end && isNaN(Date.parse(end as string))) {
			return API.v1.failure('The "end" query parameter must be a valid date.');
		}

		const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
		const { sort } = await this.parseJsonQuery();
		const _sort = { ts: sort?.ts ? sort?.ts : -1 };

		const { cursor, totalCount } = ServerEvents.findPaginated(
			{
				...(settingId && { 'data.key': 'id', 'data.value': settingId }),
				...(actor && { actor }),
				ts: {
					$gte: start ? new Date(start as string) : new Date(0),
					$lte: end ? new Date(end as string) : new Date(),
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
);
