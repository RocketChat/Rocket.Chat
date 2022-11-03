import { API } from '../../../../../app/api/server';
import { findPriority, findPriorityById, createPriority } from './lib/priorities';

API.v1.addRoute(
	'livechat/priorities',
	{
		authRequired: true,
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
		permissionsRequired: { POST: { permissions: ['manage-livechat-priorities'], operation: 'hasAny' } },
	},
	{
		async post() {
			const { name, level } = this.bodyParams;
			console.error('livechat/priority', name, level);
			check(name, String);
			check(level, String);
			const insert = await createPriority({ name, level });
			if (insert !== false) {
				return API.v1.success({ priorities: insert });
			}
			return API.v1.failure();
		},
		async put() {
			const { priorityId } = this.urlParams;
			const { name, level } = this.bodyParams;
			console.error('livechat/priority', priorityId, name, level);
			check(priorityId, String);
			check(name, String);
			check(level, String);
			const update = await LivechatPriority.updateOneById(priorityId, { name, level });
			if (update !== false) {
				return API.v1.success({ priorities: update });
			}
			return API.v1.failure();
		},
	},
);

API.v1.addRoute(
	'livechat/priority/:priorityId',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' } } },
	{
		async get() {
			check(this.urlParams, {
				priorityId: String,
			});
			const { priorityId } = this.urlParams;
			const priority = await findPriorityById({
				priorityId,
			});

			if (!priority) {
				return API.v1.notFound(`Priority with id ${priorityId} not found`);
			}

			return API.v1.success(priority);
		},
	},
);
