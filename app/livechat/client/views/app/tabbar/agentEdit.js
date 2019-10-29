import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { getCustomFormTemplate } from '../customTemplates/register';
import './agentEdit.html';
import { AgentUsers } from '../../../collections/AgentUsers';
import { LivechatDepartmentAgents } from '../../../collections/LivechatDepartmentAgents';
import { LivechatDepartment } from '../../../collections/LivechatDepartment';
import { hasPermission } from '../../../../../authorization';
import { t, handleError } from '../../../../../utils';

Template.agentEdit.helpers({
	canEditDepartment() {
		return hasPermission('add-livechat-department-agents');
	},

	agent() {
		return Template.instance().agent.get();
	},

	availableDepartments() {
		return Template.instance().avaliableDepartments.get();
	},

	hasAvailableDepartments() {
		if (!hasPermission('add-livechat-department-agents')) {
			return;
		}

		const availableDepartments = [...Template.instance().avaliableDepartments.get()];
		return availableDepartments.length > 0;
	},

	agentDepartments() {
		const deptIds = Template.instance().agentDepartments.get();
		return LivechatDepartment.find({ _id: { $in: deptIds } }).fetch();
	},

	customFieldsTemplate() {
		return getCustomFormTemplate('livechatAgentEditForm');
	},

	agentDataContext() {
		// To make the dynamic template reactive we need to pass a ReactiveVar through the data property
		// because only the dynamic template data will be reloaded
		return Template.instance().agent;
	},
});

Template.agentEdit.events({
	'click .cancel'(e) {
		e.stopPropagation();
		e.preventDefault();

		return this.back && this.back();
	},

	'submit #agent-form'(e, instance) {
		e.preventDefault();
		const _id = $(e.currentTarget).data('id');

		const agentData = {};
		instance.$('.customFormField').each((i, el) => {
			const elField = instance.$(el);
			const name = elField.attr('name');
			agentData[name] = elField.val();
		});

		const agentDepartments = instance.agentDepartments.get();
		Meteor.call('livechat:saveAgentInfo', _id, agentData, agentDepartments, (error) => {
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			return this.back && this.back();
		});
	},

	'click .remove-department'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		if (!hasPermission('add-livechat-department-agents')) {
			return;
		}

		const { currentTarget: { dataset: { id } } } = e;
		const agentDepartments = instance.agentDepartments.get();
		instance.agentDepartments.set(agentDepartments.filter((el) => el !== id));
	},

	'click #addDepartment'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		if ($('#departmentSelect').find(':selected').is(':disabled')) {
			return;
		}

		const agentDepartments = [...instance.agentDepartments.get()];
		const deptVal = $('#departmentSelect').val();
		if (deptVal === '' || agentDepartments.indexOf(deptVal) > -1) {
			return;
		}

		agentDepartments.push(deptVal);
		instance.agentDepartments.set(agentDepartments);
		$('#departmentSelect').val('placeholder');
	},
});

Template.agentEdit.onCreated(function() {
	this.agent = new ReactiveVar();
	this.agentDepartments = new ReactiveVar([]);
	this.avaliableDepartments = new ReactiveVar([]);
	this.back = Template.currentData().back;

	this.subscribe('livechat:agents');
	this.subscribe('livechat:departments', () => {
		this.avaliableDepartments.set(LivechatDepartment.find({ enabled: true }, { sort: { name: 1 } }).fetch());
	});

	this.autorun(() => {
		const { agentId } = Template.currentData();

		if (agentId) {
			const agent = AgentUsers.findOne(agentId);

			this.subscribe('livechat:departmentAgents', null, agentId, () => {
				this.agentDepartments.set(LivechatDepartmentAgents.find({ agentId }).map((deptAgent) => deptAgent.departmentId));
			});

			this.agent.set(agent);
		}
	});
});
