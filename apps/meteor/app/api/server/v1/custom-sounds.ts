import { CustomSounds } from '@rocket.chat/models';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'custom-sounds.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, query } = await this.parseJsonQuery();
			const { cursor, totalCount } = CustomSounds.findPaginated(query, {
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
	},
);
