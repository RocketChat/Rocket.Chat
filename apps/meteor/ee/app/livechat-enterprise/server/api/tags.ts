import { findTags, findTagById } from './lib/tags';
import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';

API.v1.addRoute(
	'livechat/tags',
	{
		authRequired: true,
		permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } },
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { text, viewAll, department } = this.queryParams;

			return API.v1.success(
				await findTags({
					userId: this.userId,
					text,
					department,
					viewAll: viewAll === 'true',
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
	{
		authRequired: true,
		permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } },
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { tagId } = this.urlParams;

			const tag = await findTagById({
				userId: this.userId,
				tagId,
			});

			if (!tag) {
				return API.v1.notFound('Tag not found');
			}

			return API.v1.success(tag);
		},
	},
);
