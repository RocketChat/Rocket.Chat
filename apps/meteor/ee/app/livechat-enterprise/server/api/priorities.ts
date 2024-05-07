import { LivechatPriority } from '@rocket.chat/models';
import { isGETLivechatPrioritiesParams, isPUTLivechatPriority } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { findPriority, updatePriority } from './lib/priorities';

API.v1.addRoute(
	'livechat/priorities',
	{
		authRequired: true,
		validateParams: isGETLivechatPrioritiesParams,
		permissionsRequired: { GET: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' } },
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
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
	'livechat/priorities/:priorityId',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' },
			PUT: { permissions: ['manage-livechat-priorities'], operation: 'hasAny' },
		},
		validateParams: { PUT: isPUTLivechatPriority },
	},
	{
		async get() {
			const { priorityId } = this.urlParams;
			const priority = await LivechatPriority.findOneById(priorityId);

			if (!priority) {
				return API.v1.notFound(`Priority with id ${priorityId} not found`);
			}

			return API.v1.success(priority);
		},
		async put() {
			const { priorityId } = this.urlParams;
			await updatePriority(priorityId, this.bodyParams);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/priorities.reset',
	{
		authRequired: true,
		permissionsRequired: {
			POST: { permissions: ['manage-livechat-priorities'], operation: 'hasAny' },
			GET: { permissions: ['manage-livechat-priorities'], operation: 'hasAny' },
		},
	},
	{
		async post() {
			if (!(await LivechatPriority.canResetPriorities())) {
				return API.v1.failure();
			}
			await LivechatPriority.resetPriorities();
			return API.v1.success();
		},
		async get() {
			return API.v1.success({ reset: await LivechatPriority.canResetPriorities() });
		},
	},
);
