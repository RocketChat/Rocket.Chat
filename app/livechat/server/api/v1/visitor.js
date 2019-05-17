import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Rooms, LivechatVisitors, LivechatCustomField } from '../../../../models';
import { hasPermission } from '../../../../authorization';
import { API } from '../../../../api';
import { findGuest, normalizeHttpHeaderData } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/visitor', {
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

			const { token, customFields } = this.bodyParams.visitor;
			const guest = this.bodyParams.visitor;

			if (this.bodyParams.visitor.phone) {
				guest.phone = { number: this.bodyParams.visitor.phone };
			}

			guest.connectionData = normalizeHttpHeaderData(this.request.headers);
			const visitorId = Livechat.registerGuest(guest);

			let visitor = LivechatVisitors.getVisitorByToken(token);
			// If it's updating an existing visitor, it must also update the roomInfo
			const cursor = Rooms.findOpenByVisitorToken(token);
			cursor.forEach((room) => {
				Livechat.saveRoomInfo(room, visitor);
			});

			if (customFields && customFields instanceof Array) {
				customFields.forEach((field) => {
					const customField = LivechatCustomField.findOneById(field.key);
					if (!customField) {
						return;
					}
					const { key, value, overwrite } = field;
					if (customField.scope === 'visitor' && !LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite)) {
						return API.v1.failure();
					}
				});
			}

			visitor = LivechatVisitors.findOneById(visitorId);
			return API.v1.success({ visitor });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/visitor/:token', {
	get() {
		try {
			check(this.urlParams, {
				token: String,
			});

			const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.token);
			return API.v1.success({ visitor });
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
	delete() {
		try {
			check(this.urlParams, {
				token: String,
			});

			const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.token);
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}

			const { _id } = visitor;
			const result = Livechat.removeGuest(_id);
			if (result) {
				return API.v1.success({
					visitor: {
						_id,
						ts: new Date().toISOString(),
					},
				});
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
});

API.v1.addRoute('livechat/visitor/:token/room', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		const rooms = Rooms.findOpenByVisitorToken(this.urlParams.token, {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				servedBy: 1,
			},
		}).fetch();
		return API.v1.success({ rooms });
	},
});

API.v1.addRoute('livechat/visitor.status', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				status: String,
			});

			const { token, status } = this.bodyParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			Livechat.notifyGuestStatusChanged(token, status);

			return API.v1.success({ token, status });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
