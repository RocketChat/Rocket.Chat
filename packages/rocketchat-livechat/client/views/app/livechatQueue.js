/* globals LivechatQueueUser */

Template.livechatQueue.helpers({
	departments() {
		return LivechatDepartment.find({
			enabled: true
		}, {
			sort: {
				name: 1
			}
		});
	},

	users() {
		let users = [];

		let showOffline = Template.instance().showOffline.get();

		LivechatQueueUser.find({
			departmentId: this._id
		}, {
			sort: {
				count: 1,
				order: 1,
				username: 1
			}
		}).forEach((user) => {
			let options = { fields: { _id: 1 } };
			let userFilter = { _id: user.agentId, status: { $ne: 'offline' } };
			let agentFilter = { _id: user.agentId, statusLivechat: 'available' };

			if (showOffline[this._id] || (Meteor.users.findOne(userFilter, options) && AgentUsers.findOne(agentFilter, options))) {
				users.push(user);
			}
		});

		return users;
	},

	hasPermission() {
		const user = RocketChat.models.Users.findOne(Meteor.userId(), { fields: { statusLivechat: 1 } });
		return RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager') || (user.statusLivechat === 'available' && RocketChat.settings.get('Livechat_show_queue_list_link'));
	}
});

Template.livechatQueue.events({
	'click .show-offline'(event, instance) {
		let showOffline = instance.showOffline.get();

		showOffline[this._id] = event.currentTarget.checked;

		instance.showOffline.set(showOffline);
	}
});

Template.livechatQueue.onCreated(function() {
	this.showOffline = new ReactiveVar({});

	this.subscribe('livechat:queue');
	this.subscribe('livechat:agents');
	this.subscribe('livechat:departments');
});
