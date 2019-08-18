import { check, Match } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/session.updateVisitCount/:token', {
	post() {
		try {
			check(this.urlParams, {
				token: String,
			});

			const updatedCount = Livechat.updateVisitorCount(this.urlParams.token);
			return API.v1.success({ updatedCount });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/session.visitorInfo/:token', {
	get() {
		try {
			check(this.urlParams, {
				token: String,
			});

			const visitorInfo = Livechat.getVisitorLocation(this.urlParams.token);
			return API.v1.success(visitorInfo);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/session.addLocationData', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				location: Match.Maybe(Match.ObjectIncluding({
					city: String,
					countryCode: String,
					countryName: String,
					latitude: Number,
					longitude: Number,
				})),
				deviceInfo: Match.ObjectIncluding({
					os: String,
					osVersion: Number,
					browserName: String,
					browserVersion: Number,
				}),
			});

			Livechat.updateVisitorLocation(this.bodyParams);
			return API.v1.success();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/session.updateVisitorSessionOnRegister', {
	post() {
		try {
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

			Livechat.updateVisitorSession(this.bodyParams.visitor);
			return API.v1.success();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/session.updateSessionStatus', {
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
