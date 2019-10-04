import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { ChatRoom } from '../../../../../models';
import { t } from '../../../../../utils';
import './visitorForward.html';
import { APIClient } from '../../../../../utils/client';

Template.visitorForward.helpers({
	visitor() {
		return Template.instance().visitor.get();
	},
	hasDepartments() {
		return Template.instance().departments.get().filter((department) => department.enabled === true).length > 0;
	},
	departments() {
		return Template.instance().departments.get().filter((department) => department.enabled === true);
	},
	agents() {
		return Template.instance().agents.get()
			.filter((agent) => agent._id !== Meteor.userId() && agent.status !== 'offline' && agent.statusLivechat === 'available');
	},
	agentName() {
		return this.name || this.username;
	},
});

Template.visitorForward.onCreated(async function() {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();
	this.agents = new ReactiveVar([]);
	this.departments = new ReactiveVar([]);

	this.autorun(() => {
		this.visitor.set(Meteor.users.findOne({ _id: Template.currentData().visitorId }));
	});

	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().roomId }));
	});

	const { users } = await APIClient.v1.get('livechat/users/agent?sort={"name": 1, "username": 1}');
	const { departments } = await APIClient.v1.get('livechat/department');
	this.agents.set(users);
	this.departments.set(departments);
});


Template.visitorForward.events({
	'submit form'(event, instance) {
		event.preventDefault();

		const transferData = {
			roomId: instance.room.get()._id,
		};

		if (instance.find('#forwardUser').value) {
			transferData.userId = instance.find('#forwardUser').value;
		} else if (instance.find('#forwardDepartment').value) {
			transferData.departmentId = instance.find('#forwardDepartment').value;
		}

		Meteor.call('livechat:transfer', transferData, (error, result) => {
			if (error) {
				toastr.error(t(error.error));
			} else if (result) {
				this.save();
				toastr.success(t('Transferred'));
				FlowRouter.go('/');
			} else {
				toastr.warning(t('No_available_agents_to_transfer'));
			}
		});
	},

	'change #forwardDepartment, blur #forwardDepartment'(event, instance) {
		if (event.currentTarget.value) {
			instance.find('#forwardUser').value = '';
		}
	},

	'change #forwardUser, blur #forwardUser'(event, instance) {
		if (event.currentTarget.value && instance.find('#forwardDepartment')) {
			instance.find('#forwardDepartment').value = '';
		}
	},

	'click .cancel'(event) {
		event.preventDefault();

		this.cancel();
	},
});
