import { CustomSounds } from '@rocket.chat/models';
import { GETCustomSoundsListQuerySchema, GETCustomSoundsListResponseSchema } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const customSoundsEndpoints = API.v1.get(
	'custom-sounds.list',
	{
		authRequired: true,
		query: GETCustomSoundsListQuerySchema,
		response: {
			200: GETCustomSoundsListResponseSchema,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
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

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof customSoundsEndpoints> {}
}
