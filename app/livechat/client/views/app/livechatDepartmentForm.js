import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';

import { t, handleError } from '../../../../utils';
import { AgentUsers } from '../../collections/AgentUsers';
import { LivechatDepartment } from '../../collections/LivechatDepartment';
import { LivechatDepartmentAgents } from '../../collections/LivechatDepartmentAgents';
import './livechatDepartmentForm.html';

Template.livechatDepartmentForm.helpers({
	department() {
		return Template.instance().department.get();
	},
	agents() {
		return Template.instance().department && !_.isEmpty(Template.instance().department.get()) ? Template.instance().department.get().agents : [];
	},
	selectedAgents() {
		return _.sortBy(Template.instance().selectedAgents.get(), 'username');
	},
	availableAgents() {
		const selected = _.pluck(Template.instance().selectedAgents.get(), 'username');
		return AgentUsers.find({ username: { $nin: selected } }, { sort: { username: 1 } });
	},
	showOnRegistration(value) {
		const department = Template.instance().department.get();
		return department.showOnRegistration === value || (department.showOnRegistration === undefined && value === true);
	},
	showOnOfflineForm(value) {
		const department = Template.instance().department.get();
		return department.showOnOfflineForm === value || (department.showOnOfflineForm === undefined && value === true);
	},
});

Template.livechatDepartmentForm.events({
	'submit #department-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const _id = $(e.currentTarget).data('id');
		const enabled = instance.$('input[name=enabled]:checked').val();
		const name = instance.$('input[name=name]').val();
		const description = instance.$('textarea[name=description]').val();
		const showOnRegistration = instance.$('input[name=showOnRegistration]:checked').val();
		const email = instance.$('input[name=email]').val();
		const showOnOfflineForm = instance.$('input[name=showOnOfflineForm]:checked').val();

		if (enabled !== '1' && enabled !== '0') {
			return toastr.error(t('Please_select_enabled_yes_or_no'));
		}

		if (name.trim() === '') {
			return toastr.error(t('Please_fill_a_name'));
		}

		if (email.trim() === '' && showOnOfflineForm === '1') {
			return toastr.error(t('Please_fill_an_email'));
		}

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const departmentData = {
			enabled: enabled === '1',
			name: name.trim(),
			description: description.trim(),
			showOnRegistration: showOnRegistration === '1',
			showOnOfflineForm: showOnOfflineForm === '1',
			email: email.trim(),
		};

		const departmentAgents = [];

		instance.selectedAgents.get().forEach((agent) => {
			agent.count = instance.$(`.count-${ agent.agentId }`).val();
			agent.order = instance.$(`.order-${ agent.agentId }`).val();

			departmentAgents.push(agent);
		});

		Meteor.call('livechat:saveDepartment', _id, departmentData, departmentAgents, function(error/* , result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-departments');
		});
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-departments');
	},

	'click .remove-agent'(e, instance) {
		e.preventDefault();

		let selectedAgents = instance.selectedAgents.get();
		selectedAgents = _.reject(selectedAgents, (agent) => agent._id === this._id);
		instance.selectedAgents.set(selectedAgents);
	},

	'click .available-agents li'(e, instance) {
		const selectedAgents = instance.selectedAgents.get();
		const agent = _.clone(this);
		agent.agentId = this._id;
		delete agent._id;
		selectedAgents.push(agent);
		instance.selectedAgents.set(selectedAgents);
	},
});

Template.livechatDepartmentForm.onCreated(function() {
	this.department = new ReactiveVar({ enabled: true });
	this.selectedAgents = new ReactiveVar([]);

	this.subscribe('livechat:agents');

	this.autorun(() => {
		const sub = this.subscribe('livechat:departments', FlowRouter.getParam('_id'));
		if (sub.ready()) {
			const department = LivechatDepartment.findOne({ _id: FlowRouter.getParam('_id') });
			if (department) {
				this.department.set(department);

				this.subscribe('livechat:departmentAgents', department._id, () => {
					const newSelectedAgents = [];
					LivechatDepartmentAgents.find({ departmentId: department._id }).forEach((agent) => {
						newSelectedAgents.push(agent);
					});
					this.selectedAgents.set(newSelectedAgents);
				});
			}
		}
	});
});
