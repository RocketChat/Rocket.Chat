import { check, Match } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/updateVisitCount/:token', {
	post() {
		check(this.urlParams, {
			token: String,
		});

		return Livechat.updateVisitorCount(this.urlParams.token);
	},
});

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
			deviceInfo: Match.ObjectIncluding({
				os: String,
				osVersion: Number,
				browserName: String,
				browserVersion: Number,
			}),
		});

		return Livechat.updateVisitorLocation(this.bodyParams);
	},
});

API.v1.addRoute('livechat/updateVisitorSessionOnRegister', {
	post() {
		check(this.bodyParams, {
			visitor: Match.ObjectIncluding({
				token: String,
				name: Match.Maybe(String),
				email: Match.Maybe(String),
				department: Match.Maybe(String),
				phone: Match.Maybe(String),
				username: Match.Maybe(String),
				customFields: Match.Maybe([
					Match.ObjectIncluding({
						key: String,
						value: String,
						overwrite: Boolean,
					}),
				]),
			}),
		});

		return Livechat.updateVisitorSession(this.bodyParams.visitor);
	},
});

API.v1.addRoute('livechat/updateSessionStatus', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				status: String,
			});

			const { token, status } = this.bodyParams;

			Livechat.notifyGuestSessionStatusChanged(token, status);

			return API.v1.success({ token, status });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
