import { Match, check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import LivechatVisitors from '../../../server/models/LivechatVisitors';

RocketChat.API.v1.addRoute('livechat/visitor', {
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

			const visitorId = RocketChat.Livechat.registerGuest(guest);

			let visitor = LivechatVisitors.getVisitorByToken(token);
			// If it's updating an existing visitor, it must also update the roomInfo
			const cursor = RocketChat.models.Rooms.findOpenByVisitorToken(token);
			cursor.forEach((room) => {
				RocketChat.Livechat.saveRoomInfo(room, visitor);
			});

			if (customFields && customFields instanceof Array) {
				customFields.forEach((field) => {
					const customField = RocketChat.models.LivechatCustomField.findOneById(field.key);
					if (!customField) {
						return;
					}
					const { key, value, overwrite } = field;
					if (customField.scope === 'visitor' && !LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite)) {
						return RocketChat.API.v1.failure();
					}
				});
			}

			visitor = LivechatVisitors.findOneById(visitorId);
			return RocketChat.API.v1.success({ visitor });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});

RocketChat.API.v1.addRoute('livechat/visitor/:token', {
	get() {
		try {
			check(this.urlParams, {
				token: String,
			});

			const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.token);
			return RocketChat.API.v1.success({ visitor });
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},
});

RocketChat.API.v1.addRoute('livechat/visitor/:token/room', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(this.urlParams.token, {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				servedBy: 1,
			},
		}).fetch();
		return RocketChat.API.v1.success({ rooms });
	},
});
