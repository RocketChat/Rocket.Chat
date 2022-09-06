import { API } from '../../../../../app/api/server';
import { findTags, findTagById } from './lib/tags';

API.v1.addRoute(
	'livechat/tags',
	{ authRequired: true, permissionsRequired: ['view-l-room', 'manage-livechat-tags'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				await findTags({
					userId: this.userId,
					text,
					pagination: {
						offset,
						count,
						sort: typeof sort === 'string' ? JSON.parse(sort || '{}') : sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/tags/:tagId',
	{ authRequired: true, permissionsRequired: ['view-l-room', 'manage-livechat-tags'] },
	{
		async get() {
			const { tagId } = this.urlParams;

			return API.v1.success(
				await findTagById({
					userId: this.userId,
					tagId,
				}),
			);
		},
	},
);
