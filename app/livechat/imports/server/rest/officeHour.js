import { API } from '../../../../../server/api';
import { findLivechatOfficeHours } from '../../../server/api/lib/officeHour';

API.v1.addRoute('livechat/office-hours', { authRequired: true }, {
	get() {
		const { officeHours } = Promise.await(findLivechatOfficeHours({ userId: this.userId }));
		return API.v1.success({
			officeHours,
		});
	},
});
