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
					/* customFields: Match.Maybe(Array) // think about receiving visitor custom fields here..*/
				}),
			});

			const visitorToken = this.bodyParams.visitor.token;

			let visitor = LivechatVisitors.getVisitorByToken(visitorToken);
			if (!visitor) {
				const visitorId = RocketChat.Livechat.registerGuest(this.bodyParams.visitor);
				visitor = LivechatVisitors.findOneById(visitorId);
			}
			return RocketChat.API.v1.success({ visitor });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});

/* authRequired: true needs to be removed */
RocketChat.API.v1.addRoute('livechat/visitor/:token', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.token);
		return RocketChat.API.v1.success(visitor);
	},
});

/* authRequired: true needs to be removed */
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
