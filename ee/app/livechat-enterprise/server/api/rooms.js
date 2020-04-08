import { API } from '../../../../../app/api/server';
import { setPriorityToRoom } from './lib/rooms';

API.v1.addRoute('livechat/rooms.prioritize', { authRequired: true }, {
	put() {
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
