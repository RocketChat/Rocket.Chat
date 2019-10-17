import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { settings } from '../../../../settings';
import { hasPermission } from '../../../../authorization';
import { Users } from '../../../../models';
import './livechatQueue.html';
import { APIClient } from '../../../../utils/client';

Template.livechatQueue.helpers({
	departments() {
		return Template.instance().departments.get().filter((department) => department.enabled === true);
	},

	users() {
		const users = [];

		const showOffline = Template.instance().showOffline.get();

		Template.instance().queue.get()
			.filter((user) => user.departmentId === this._id)
			.forEach((user) => {
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
	this.departments = new ReactiveVar([]);
	this.queue = new ReactiveVar([]);

	const { users } = await APIClient.v1.get('livechat/users/agent');
	const { departments } = await APIClient.v1.get('livechat/department?sort={"name": 1}');
	const { users: queue } = await APIClient.v1.get('livechat/users.queue?=sort={"count": 1, "order": 1, "username": 1}');
	this.agents.set(users);
	this.departments.set(departments);
	this.queue.set(queue);
});
