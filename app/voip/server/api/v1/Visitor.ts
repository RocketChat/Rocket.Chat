import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../../authorization/server';
import { Voip } from '../../lib/Voip';
import { API } from '../../../../api/server';

API.v1.addRoute('voip/visitor', {
	async post() {
		try {
			check(this.bodyParams, {
				visitor: Match.ObjectIncluding({
					token: String,
					name: Match.Maybe(String),
					email: Match.Maybe(String),
					department: Match.Maybe(String),
					phone: Match.Maybe(String),
					username: Match.Maybe(String),
				}),
			});
			const { visitor } = this.bodyParams;
			const { id, token, name, email, department, phone, username } = visitor;
			const guest = {
				id,
				name,
				token,
				email,
				department,
				username,
				phone: { number: phone },
			};
			const visitorId = await Voip.registerGuest(guest.id,
				guest.token,
				guest.name,
				guest.email,
				guest.department,
				guest.phone,
				guest.username);
			const existingVisitor = await Voip.getVisitorByToken(token, {});
			if (existingVisitor) {
				// If it's updating an existing visitor, it must also update the roomInfo
				const cursor = Voip.findOpenRoomByVisitorToken(token, {});
				cursor.forEach((room: any) => {
					Voip.saveRoomInfo(room, existingVisitor);
				});
			}
			return API.v1.success({ visitor: await Voip.getVisitorById(visitorId) });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('voip/visitor/:token', {
	async get() {
		try {
			check(this.urlParams, {
				token: String,
			});
			const { token } = this.urlParams;
			const visitor = await Voip.getVisitorByToken(token);
			return API.v1.success({ visitor });
		} catch (e: any) {
			return API.v1.failure(e.error);
		}
	},
	async delete() {
		try {
			check(this.urlParams, {
				token: String,
			});
			const { token } = this.urlParams;
			const visitor = await Voip.getVisitorByToken(token);
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}

			const { _id } = visitor;
			const result = await Voip.removeGuest(_id);
			if (result) {
				return API.v1.success({
					visitor: {
						_id,
						ts: new Date().toISOString(),
					},
				});
			}
			return API.v1.failure();
		} catch (e: any) {
			return API.v1.failure(e.error);
		}
	},
});

API.v1.addRoute('voip/visitor/:token/room', { authRequired: true }, {
	async get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}
		const { token } = this.urlParams;
		const rooms = await Voip.findOpenRoomByVisitorToken(token, {
			projection: {
				name: 1,
				// t: 1,
				u: 1,
				servedBy: 1,
			},
		}).toArray();
		return API.v1.success({ rooms });
	},
});

API.v1.addRoute('voip/visitor.status', {
	async post() {
		try {
			check(this.bodyParams, {
				token: String,
				status: String,
			});

			const { token, status } = this.bodyParams;

			const visitor = await Voip.getVisitorByToken(token, {});
			if (!visitor) {
				throw new Meteor.Error('invalid-token');
			}
			Voip.notifyGuestStatusChanged(token, status);
			return API.v1.success({ token, status });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
