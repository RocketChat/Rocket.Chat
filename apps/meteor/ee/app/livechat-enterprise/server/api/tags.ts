import { Settings } from '@rocket.chat/models';

import { API } from '../../../../../app/api/server';
import { findTags, findTagById } from './lib/tags';

API.v1.addRoute(
	'livechat/tags',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } } },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
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
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } } },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
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
