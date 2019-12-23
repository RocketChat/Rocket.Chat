import { API } from '../api';
import { getServerInfo } from '../lib/server-info';

API.default.addRoute('info', { authRequired: false }, {
	get() {
		const user = this.getLoggedInUser();

		return API.v1.success(Promise.await(getServerInfo({ user })));
	},
});
