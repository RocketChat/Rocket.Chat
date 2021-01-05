import { API } from '../api';
import { find } from '../lib/email-channel';

API.v1.addRoute('email-channel', { authRequired: true }, {
	get() {
		return API.v1.success({
			emailChannels: Promise.await(find({ uid: this.userId })),
		});
	},
});
