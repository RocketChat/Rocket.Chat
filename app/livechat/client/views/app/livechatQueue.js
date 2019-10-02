import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { settings } from '../../../../settings';
import { hasPermission } from '../../../../authorization';
import { Users } from '../../../../models';
import { LivechatDepartment } from '../../collections/LivechatDepartment';
import { LivechatQueueUser } from '../../collections/LivechatQueueUser';
import './livechatQueue.html';
import { APIClient } from '../../../../utils/client';

Template.livechatQueue.helpers({
	departments() {
		return LivechatDepartment.find({
			enabled: true,
		}, {
			sort: {
				name: 1,
			},
		});
	},

	users() {
		const users = [];

		const showOffline = Template.instance().showOffline.get();

		LivechatQueueUser.find({
			departmentId: this._id,
		}, {
			sort: {
				count: 1,
				order: 1,
				username: 1,
			},
		}).forEach((user) => {
			const options = { fields: { _id: 1 } };
			const userFilter = { _id: user.agentId, status: { $ne: 'offline' } };
			const agent = Template.instance().agents.get().find((agent) => agent._id === user.agentId && agent.statusLivechat === 'available');

			if (showOffline[this._id] || (Meteor.users.findOne(userFilter, options) && agent)) {
				users.push(user);
			}
		});

		return users;
	},

	hasPermission() {
		const user = Users.findOne(Meteor.userId(), { fields: { statusLivechat: 1 } });
		return hasPermission(Meteor.userId(), 'view-livechat-queue') || (user.statusLivechat === 'available' && settings.get('Livechat_show_queue_list_link'));
	},
});

Template.livechatQueue.events({
	'click .show-offline'(event, instance) {
		const showOffline = instance.showOffline.get();

		showOffline[this._id] = event.currentTarget.checked;

		instance.showOffline.set(showOffline);
	},
});

Template.livechatQueue.onCreated(async function() {
	this.showOffline = new ReactiveVar({});
	this.agents = new ReactiveVar([]);

	this.subscribe('livechat:queue');
	this.subscribe('livechat:departments');
	const { users } = await APIClient.v1.get('livechat/users/agent');
	this.agents.set(users);
});
