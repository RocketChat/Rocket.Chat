import { API } from '../../../../../app/api/server';
import { findPriorities, findPriorityById } from './lib/priorities';

API.v1.addRoute(
	'livechat/priorities.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				Promise.await(
					findPriorities({
						userId: this.userId,
						text,
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

API.v1.addRoute(
	'livechat/priorities.getOne',
	{ authRequired: true },
	{
		get() {
			const { priorityId } = this.queryParams;

			return API.v1.success(
				Promise.await(
					findPriorityById({
						userId: this.userId,
						priorityId,
					}),
				),
			);
		},
	},
);
