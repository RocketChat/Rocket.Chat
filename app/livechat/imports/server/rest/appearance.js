import { API } from '../../../../../server/api/v1';
import { findAppearance } from '../../../server/api/lib/appearance';

API.v1.addRoute('livechat/appearance', { authRequired: true }, {
	get() {
		const { appearance } = Promise.await(findAppearance({ userId: this.userId }));

		return API.v1.success({
			appearance,
		});
	},
});
