import { API } from '../../../../../app/api/server';
import { findPriorities, findPriorityById, setPriorityToRoom } from './lib/priorities';

API.v1.addRoute('livechat/priorities.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findPriorities({
			userId: this.userId,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('livechat/priorities.getOne', { authRequired: true }, {
	get() {
		const { priorityId } = this.queryParams;

		return API.v1.success(Promise.await(findPriorityById({
			userId: this.userId,
			priorityId,
		})));
	},
});

API.v1.addRoute('livechat/priorities.setPriorityToRoom', { authRequired: true }, {
	post() {
		const { roomId, priorityId } = this.bodyParams;
		if (!roomId) {
			return API.v1.failure('The \'roomId\' param is required');
		}
		Promise.await(setPriorityToRoom({
			userId: this.userId,
			roomId,
			priorityId,
		}));
		return API.v1.success();
	},
});
