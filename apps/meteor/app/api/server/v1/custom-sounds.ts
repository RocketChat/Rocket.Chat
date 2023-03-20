import { CustomSounds } from '@rocket.chat/models';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { parseJsonQuery } from '../helpers/parseJsonQuery';

API.v1.addRoute(
	'custom-sounds.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, query } = await parseJsonQuery(
				this.request.route,
				this.userId,
				this.queryParams,
				this.logger,
				this.queryFields,
				this.queryOperations,
			);
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
