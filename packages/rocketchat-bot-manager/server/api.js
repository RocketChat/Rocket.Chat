RocketChat.API.v1.addRoute('bots.getLiveStats', { authRequired: true }, {
	get() {
		const bot = this.getUserFromParams();

		const statistics = Meteor.wrapAsync((callback) => {
			Meteor.runAsUser(this.userId, () => Meteor.call('getBotLiveStats', bot, (err, response) => {
				callback(err, response);
			}));
		})();
		return RocketChat.API.v1.success({ statistics });
	},
});

RocketChat.API.v1.addRoute('bots.getServerStats', { authRequired: true }, {
	get() {
		const bot = this.getUserFromParams();

		const statistics = Meteor.wrapAsync((callback) => {
			Meteor.runAsUser(this.userId, () => Meteor.call('getBotServerStats', bot, (err, response) => {
				callback(err, response);
			}));
		})();
		return RocketChat.API.v1.success({ statistics });
	},
});

RocketChat.API.v1.addRoute('bots.getCustomClientData', { authRequired: true }, {
	get() {
		const bot = this.getUserFromParams();
		const { userId } = this;
		let customClientData = {};
		if (bot._id === userId || RocketChat.authz.hasPermission(userId, 'manage-bot-account')) {
			customClientData = bot.customClientData;
		}
		return RocketChat.API.v1.success({ customClientData });
	},
});
