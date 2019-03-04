import { Meteor } from 'meteor/meteor';
import { API } from 'meteor/rocketchat:api';
import { hasPermission } from 'meteor/rocketchat:authorization';

API.v1.addRoute('bots.getServerStats', { authRequired: true }, {
	get() {
		const bot = this.getUserFromParams();

		const statistics = Meteor.wrapAsync((callback) => {
			Meteor.runAsUser(this.userId, () => Meteor.call('getBotServerStats', bot, (err, response) => {
				callback(err, response);
			}));
		})();
		return API.v1.success({ statistics });
	},
});

API.v1.addRoute('bots.getCustomClientData', { authRequired: true }, {
	get() {
		const bot = this.getUserFromParams();
		const { userId } = this;
		let customClientData = {};
		if (bot._id === userId || hasPermission(userId, 'manage-bot-account')) {
			customClientData = bot.customClientData;
		}
		return API.v1.success({ customClientData });
	},
});
