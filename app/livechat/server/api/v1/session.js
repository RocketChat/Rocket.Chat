import { check, Match } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/userLocation/:token', {
	get() {
		check(this.urlParams, {
			token: String,
		});

		return Livechat.getVisitorLocation(this.urlParams.token);
	},
});

API.v1.addRoute('livechat/addLocationData', {
	post() {
		check(this.bodyParams, {
			token: String,
			location: Match.ObjectIncluding({
				city: String,
				countryCode: String,
				countryName: String,
				latitude: Number,
				longitude: Number,
			}),
		});

		return Livechat.updateVisitorLocation(this.bodyParams);
	},
});
