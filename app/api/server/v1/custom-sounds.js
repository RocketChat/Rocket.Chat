import { API } from '../api';
import { findCustomSounds } from '../lib/custom-sounds';

API.v1.addRoute(
	'custom-sounds.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();

			return API.v1.success(
				Promise.await(
					findCustomSounds({
						query,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				),
			);
		},
	},
);
