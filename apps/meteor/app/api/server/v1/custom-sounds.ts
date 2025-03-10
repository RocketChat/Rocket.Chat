import { CustomSounds } from '@rocket.chat/models';
import { isCustomSoundsListProps } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { API } from '../api';
import type { ExtractEndpoints } from '../definition';
import { getPaginationItems } from '../helpers/getPaginationItems';

const customSounds = API.v1.get(
	'custom-sounds.list',
	{
		response: {
			200: ajv.compile({
				additionalProperties: false,
				type: 'object',
				properties: {
					count: {
						type: 'number',
						description: 'The number of sounds returned in this response.',
					},
					offset: {
						type: 'number',
						description: 'The number of sounds that were skipped in this response.',
					},
					total: {
						type: 'number',
						description: 'The total number of sounds that match the query.',
					},
					sounds: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								_id: {
									type: 'string',
								},
								name: {
									type: 'string',
								},
								extension: {
									type: 'string',
								},
								createdAt: {
									type: 'string',
								},
								updatedAt: {
									type: 'string',
								},
							},
							required: ['_id', 'name', 'extension', 'createdAt', 'updatedAt'],
						},
					},
				},
				required: ['count', 'offset', 'total', 'sounds'],
			}),
		},
		query: isCustomSoundsListProps,
		authRequired: true,
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
		const { sort, query } = await this.parseJsonQuery();

		const { name } = this.queryParams;

		const filter = {
			...query,
			...(name ? { name: { $regex: escapeRegExp(name as string), $options: 'i' } } : {}),
		};

		const { cursor, totalCount } = CustomSounds.findPaginated(filter, {
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
		});
		const [sounds, total] = await Promise.all([cursor.toArray(), totalCount]);

		return API.v1.success({
			sounds,
			count: sounds.length,
			offset,
			total,
		});
	},
);

export type CustomSoundsProps = ExtractEndpoints<typeof customSounds>;
