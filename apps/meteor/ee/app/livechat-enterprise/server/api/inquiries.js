import { API } from '../../../../../app/api/server';
import { setPriorityToInquiry } from './lib/inquiries';

API.v1.addRoute(
	'livechat/inquiry.prioritize',
	{ authRequired: true },
	{
		put() {
			const { roomId, priority } = this.bodyParams;
			if (!roomId) {
				return API.v1.failure("The 'roomId' param is required");
			}
			Promise.await(
				setPriorityToInquiry({
					userId: this.userId,
					roomId,
					priority,
				}),
			);
			return API.v1.success();
		},
	},
);
