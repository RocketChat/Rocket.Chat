import { setSLAToInquiry } from './lib/inquiries';
import { API } from '../../../../../app/api/server';

API.v1.addRoute(
	'livechat/inquiry.setSLA',
	{
		authRequired: true,
		permissionsRequired: {
			PUT: { permissions: ['view-l-room', 'manage-livechat-sla'], operation: 'hasAny' },
		},
		license: ['livechat-enterprise'],
	},
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
