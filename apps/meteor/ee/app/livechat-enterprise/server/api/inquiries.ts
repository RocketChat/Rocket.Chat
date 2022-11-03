import { API } from '../../../../../app/api/server';
import { setSLAToInquiry } from './lib/inquiries';

API.v1.addRoute(
	'livechat/inquiry.prioritize',
	{ authRequired: true, permissionsRequired: { PUT: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' } } },
	{
		async put() {
			const { roomId, sla } = this.bodyParams;
			if (!roomId) {
				return API.v1.failure("The 'roomId' param is required");
			}
			await setSLAToInquiry({
				userId: this.userId,
				roomId,
				sla,
			});
			return API.v1.success();
		},
	},
);
