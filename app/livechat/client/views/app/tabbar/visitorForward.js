import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { ChatRoom } from '../../../../../models';
import { t } from '../../../../../utils';
import './visitorForward.html';
import { APIClient } from '../../../../../utils/client';
import { dispatchToastMessage } from '../../../../../../client/lib/toast';

Template.visitorForward.helpers({
	visitor() {
		return Template.instance().visitor.get();
	},
	agentName() {
		return this.name || this.username;
	},
	onSelectAgents() {
		return Template.instance().onSelectAgents;
	},
	agentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${part}</strong>`)}`;
		};
	},
	agentConditions() {
		const room = Template.instance().room.get();
		const { servedBy: { _id: agentId } = {} } = room || {};
		const _id = agentId && { $ne: agentId };
		return { _id, status: { $ne: 'offline' }, statusLivechat: 'available' };
	},
	selectedAgents() {
		return Template.instance().selectedAgents.get();
	},
	onClickTagAgent() {
		return Template.instance().onClickTagAgent;
	},
	departmentModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `${f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${part}</strong>`)}`;
		};
	},
	onClickTagDepartment() {
		return Template.instance().onClickTagDepartment;
	},
	selectedDepartments() {
		return Template.instance().selectedDepartments.get();
	},
	onSelectDepartments() {
		return Template.instance().onSelectDepartments;
	},
	departmentConditions() {
		const departmentForwardRestrictions = Template.instance().departmentForwardRestrictions.get();
		return { enabled: true, numAgents: { $gt: 0 }, ...departmentForwardRestrictions };
	},
});

Template.visitorForward.onCreated(async function () {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();
	this.departments = new ReactiveVar([]);
	this.selectedAgents = new ReactiveVar([]);
	this.selectedDepartments = new ReactiveVar([]);
	this.departmentForwardRestrictions = new ReactiveVar({});

	this.onSelectDepartments = ({ item: department }) => {
		department.text = department.name;
		this.selectedDepartments.set([department]);
		this.selectedAgents.set([]);
	};

	this.onClickTagDepartment = () => {
		this.selectedDepartments.set([]);
	};

	this.onSelectAgents = ({ item: agent }) => {
		this.selectedAgents.set([agent]);
		this.selectedDepartments.set([]);
	};

	this.onClickTagAgent = ({ username }) => {
		this.selectedAgents.set(this.selectedAgents.get().filter((user) => user.username !== username));
	};

	this.autorun(() => {
		this.visitor.set(Meteor.users.findOne({ _id: Template.currentData().visitorId }));
	});

	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().roomId }));
		const { departmentId } = this.room.get();
		if (departmentId) {
			Meteor.call('livechat:getDepartmentForwardRestrictions', departmentId, (err, result) => {
				this.departmentForwardRestrictions.set(result);
			});
		}
	});

	const { departments } = await APIClient.v1.get('livechat/department?enabled=true');
	this.departments.set(departments);
});

Template.visitorForward.events({
	'submit form'(event, instance) {
		event.preventDefault();

		const transferData = {
			roomId: instance.room.get()._id,
			comment: event.target.comment.value,
			clientAction: true,
		};

		const [user] = instance.selectedAgents.get();
		if (user) {
			transferData.userId = user._id;
		} else if (instance.selectedDepartments.get()) {
			const [department] = instance.selectedDepartments.get();
			transferData.departmentId = department && department._id;
		}

		if (!transferData.userId && !transferData.departmentId) {
			return;
		}

		Meteor.call('livechat:transfer', transferData, (error, result) => {
			if (error) {
				dispatchToastMessage({
					type: 'error',
					message: t(error.error),
				});
			} else if (result) {
				this.save();
				dispatchToastMessage({
					type: 'success',
					message: t('Transferred'),
				});
				FlowRouter.go('/');
			} else {
				dispatchToastMessage({
					type: 'warning',
					message: t('No_available_agents_to_transfer'),
				});
			}
		});
	},

	'click .cancel'(event) {
		event.preventDefault();

		this.cancel();
	},
});
