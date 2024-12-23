import { CustomSounds } from '@rocket.chat/models';
import { isCustomSoundsListProps } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'custom-sounds.list',
	{ authRequired: true, validateParams: isCustomSoundsListProps },
	{
		async get() {
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
	},
);
