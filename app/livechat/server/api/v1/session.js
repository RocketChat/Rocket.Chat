import { check } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/userLocation/:token', {
	get() {
		check(this.urlParams, {
			token: String,
		});

		return Livechat.checkUserLocation(this.urlParams.token);
	},
});

API.v1.addRoute('livechat/addLocationData', {
	post() {
		check(this.bodyParams, {
			token: String,
			location: Object,
		});

		return Livechat.addUserLocationData(this.bodyParams);
	},
});
