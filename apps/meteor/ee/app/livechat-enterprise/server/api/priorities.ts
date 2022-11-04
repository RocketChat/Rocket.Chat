import {
	isGETLivechatPrioritiesParams,
	isPOSTLivechatPriorityParams,
	isGETLivechatPriorityParams,
	isDELETELivechatPriorityParams,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { findPriority, findPriorityById, createPriority, deletePriorityById } from './lib/priorities';

API.v1.addRoute(
	'livechat/priorities',
	{
		authRequired: true,
		validateParams: isGETLivechatPrioritiesParams,
		permissionsRequired: { GET: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' } },
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				await findPriority({
					text,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/priority',
	{
		authRequired: true,
		validateParams: isPOSTLivechatPriorityParams,
		permissionsRequired: { POST: { permissions: ['manage-livechat-priorities'], operation: 'hasAny' } },
	},
	{
		async post() {
			const { name, level } = this.bodyParams;
			try {
				const insert = await createPriority({ name, level });

				return API.v1.success(insert);
			} catch (e) {
				return API.v1.notFound(String(e));
			}
		},
	},
);

API.v1.addRoute(
	'livechat/priority/:priorityId',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' },
			DELETE: { permissions: ['manage-livechat-priorities'], operation: 'hasAny' },
		},
	},
	{
		async get() {
			// todo: make urlParams work with validateParams
			if (!isGETLivechatPriorityParams(this.urlParams)) {
				return API.v1.failure('Invalid URL params');
			}
			const { priorityId } = this.urlParams;
			const priority = await findPriorityById({
				priorityId,
			});

			if (!priority) {
				return API.v1.notFound(`Priority with id ${priorityId} not found`);
			}

			return API.v1.success(priority);
		},
		async delete() {
			// todo: make urlParams work with validateParams
			if (!isDELETELivechatPriorityParams(this.urlParams)) {
				return API.v1.failure('Invalid URL params');
			}
			const { priorityId } = this.urlParams;
			try {
				const result = await deletePriorityById(priorityId);
				return API.v1.success(result);
			} catch (e) {
				return API.v1.failure(e);
			}
		},
	},
);
