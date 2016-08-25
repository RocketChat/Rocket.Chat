/* globals Restivus */
const Api = new Restivus({
	apiPath: 'livechat-api/',
	useDefaultAuth: true,
	prettyJson: true
});

Api.addRoute('sms-incoming/:service', {
	post() {
		const SMSService = RocketChat.SMS.getService(this.urlParams.service);

		const sms = SMSService.parse(this.bodyParams);

		var visitor = RocketChat.models.Users.findOneVisitorByPhone(sms.from);

		let sendMessage = {
			message: {
				_id: Random.id()
			},
			roomInfo: {
				sms: {
					from: sms.to
				}
			}
		};

		if (visitor) {
			const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.profile.token).fetch();

			if (rooms && rooms.length > 0) {
				sendMessage.message.rid = rooms[0]._id;
			} else {
				sendMessage.message.rid = Random.id();
			}
			sendMessage.message.token = visitor.profile.token;
		} else {
			sendMessage.message.rid = Random.id();
			sendMessage.message.token = Random.id();

			let userId = RocketChat.Livechat.registerGuest({
				username: sms.from.replace(/[^0-9]/g, ''),
				token: sendMessage.message.token,
				phone: {
					number: sms.from
				}
			});

			visitor = RocketChat.models.Users.findOneById(userId);
		}

		sendMessage.message.msg = sms.body;
		sendMessage.guest = visitor;

		try {
			const message = SMSService.response.call(this, RocketChat.Livechat.sendMessage(sendMessage));

			Meteor.defer(() => {
				if (sms.extra) {
					if (sms.extra.fromCountry) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
					}
					if (sms.extra.fromState) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
					}
					if (sms.extra.fromCity) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
					}
				}
			});

			return message;
		} catch (e) {
			return SMSService.error.call(this, e);
		}
	}
});

Api.addRoute('users/:type', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		try {
			let users;
			if (this.urlParams.type === 'agent') {
				users = RocketChat.authz.getUsersInRole('livechat-agent');
			} else if (this.urlParams.type === 'manager') {
				users = RocketChat.authz.getUsersInRole('livechat-manager');
			} else {
				throw 'Invalid type';
			}

			return {
				success: true,
				data: users.fetch().map(user => ({ _id: user._id, username: user.username }))
			};
		} catch (e) {
			return {
				success: false,
				error: e
			};
		}
	},
	post() {
		if (this.urlParams._id) {
			return { statusCode: 400, body: { status: 'error' } };
		}
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		// @TODO creates a new agent manager
	}
});

Api.addRoute('users/:type/:_id', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		// @TODO gets a list (if _id not present) of agents or managers or (if _id present) the agent or manager data
	},
	delete() {
		if (!this.urlParams._id) {
			return { statusCode: 400, body: { status: 'error' } };
		}
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		// @TODO removes a user from agent or manager
	}
});

Api.addRoute('departments/:_id?', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		// @TODO gets a list of departments or department data (if _id present)
	},
	post() {
		if (this.urlParams._id) {
			return { statusCode: 400, body: { status: 'error' } };
		}
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		// @TODO creates a new department
	},
	put() {
		if (!this.urlParams._id) {
			return { statusCode: 400, body: { status: 'error' } };
		}
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		// @TODO update a department
	},
	delete() {
		if (!this.urlParams._id) {
			return { statusCode: 400, body: { status: 'error' } };
		}
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return { statusCode: 403, body: { status: 'error' } };
		}

		// @TODO removes a department
	}
});
