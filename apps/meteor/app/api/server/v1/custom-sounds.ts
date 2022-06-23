import { CustomSounds } from '@rocket.chat/models';

import { API } from '../api';

API.v1.addRoute(
	'custom-sounds.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const cursor = await CustomSounds.find(query, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
			});

			const total = await cursor.count();

			const sounds = await cursor.toArray();

			return API.v1.success({
				sounds,
				count: sounds.length,
				offset,
				total,
			});
		},
	},
);
