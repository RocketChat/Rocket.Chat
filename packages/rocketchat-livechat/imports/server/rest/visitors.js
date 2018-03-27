import LivechatVisitors from '../../../server/models/LivechatVisitors';

RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.visitorToken);
		return RocketChat.API.v1.success(visitor);
	}
});

RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken/room', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(this.urlParams.visitorToken, {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				servedBy: 1
			}
		}).fetch();
		return RocketChat.API.v1.success({ rooms });
	}
});
