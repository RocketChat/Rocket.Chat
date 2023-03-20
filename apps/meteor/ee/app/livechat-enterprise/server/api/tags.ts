import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { parseJsonQuery } from '../../../../../app/api/server/helpers/parseJsonQuery';
import { findTags, findTagById } from './lib/tags';

API.v1.addRoute(
	'livechat/tags',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } } },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await parseJsonQuery(
				this.request.route,
				this.userId,
				this.queryParams,
				this.logger,
				this.queryFields,
				this.queryOperations,
			);
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
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } } },
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
