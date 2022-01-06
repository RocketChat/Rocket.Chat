import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { getCustomFormTemplate } from '../customTemplates/register';
import './agentEdit.html';
import { hasPermission } from '../../../../../authorization';
import { t, APIClient } from '../../../../../utils/client';
import { handleError } from '../../../../../../client/lib/utils/handleError';
import { dispatchToastMessage } from '../../../../../../client/lib/toast';

Template.agentEdit.helpers({
	canEditDepartment() {
		return hasPermission('add-livechat-department-agents');
	},

	agent() {
		return Template.instance().agent.get();
	},

	availableDepartments() {
		return Template.instance().availableDepartments.get();
	},

	hasAvailableDepartments() {
		if (!hasPermission('add-livechat-department-agents')) {
			return;
		}

		const availableDepartments = [...Template.instance().availableDepartments.get()];
		return availableDepartments.length > 0;
	},

	agentDepartments() {
		const deptIds = Template.instance().agentDepartments.get();
		const departments = Template.instance().departments.get();
		return departments.filter(({ _id }) => deptIds.includes(_id));
	},

	hasAgentDepartments() {
		const agentDepartments = [...Template.instance().agentDepartments.get()];
		return agentDepartments.length > 0;
	},

	customFieldsTemplate() {
		return getCustomFormTemplate('livechatAgentEditForm');
	},

	agentDataContext() {
		// To make the dynamic template reactive we need to pass a ReactiveVar through the data property
		// because only the dynamic template data will be reloaded
		return Template.instance().agent;
	},

	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
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

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			return this.back && this.back(_id);
		});
	},

	'click .remove-department'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		if (!hasPermission('add-livechat-department-agents')) {
			return;
		}

		const {
			currentTarget: {
				dataset: { id },
			},
		} = e;
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

Template.agentEdit.onCreated(async function () {
	this.agent = new ReactiveVar();
	this.ready = new ReactiveVar(false);
	this.agentDepartments = new ReactiveVar([]);
	this.departments = new ReactiveVar([]);
	this.availableDepartments = new ReactiveVar([]);
	this.back = Template.currentData().back;

	const { departments } = await APIClient.v1.get('livechat/department?sort={"name": 1}');
	this.departments.set(departments);
	this.availableDepartments.set(departments.filter(({ enabled }) => enabled));

	this.autorun(async () => {
		this.ready.set(false);

		const { agentId } = Template.currentData();

		if (!agentId) {
			return;
		}

		const { user } = await APIClient.v1.get(`livechat/users/agent/${agentId}`);
		const { departments } = await APIClient.v1.get(`livechat/agents/${agentId}/departments`);
		this.agent.set(user);
		this.agentDepartments.set((departments || []).map((department) => department.departmentId));
		this.ready.set(true);
	});
});
