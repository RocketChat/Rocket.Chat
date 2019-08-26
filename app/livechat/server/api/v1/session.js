import { check, Match } from 'meteor/check';

import { API } from '../../../../api';
import { Livechat } from '../../lib/Livechat';
import { LivechatSessions } from '../../../../models';

API.v1.addRoute('livechat/session.incVisitCount/:token', {
	post() {
		try {
			check(this.urlParams, {
				token: String,
			});

			const { count } = LivechatSessions.updateSessionCount(this.urlParams.token);
			return API.v1.success({ count });
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

			const visitorInfo = LivechatSessions.findOneByToken(this.urlParams.token);
			return API.v1.success(visitorInfo);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/session.register', {
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

			const { token, location, deviceInfo } = this.bodyParams;
			const updatedSession = LivechatSessions.insert({
				token,
				location,
				deviceInfo,
				createdAt: new Date(),
				count: 1,
			});
			return API.v1.success({ updatedSession });
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

			const visitorInfo = this.bodyParams.visitor;
			const query = {
				token: visitorInfo.token,
			};

			delete visitorInfo.token;
			const update = {
				$set: {
					visitorInfo,
				},
			};
			LivechatSessions.update(query, update);
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

			Livechat.notifyGuestStatusChanged(token, status);

			return API.v1.success({ token, status });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
