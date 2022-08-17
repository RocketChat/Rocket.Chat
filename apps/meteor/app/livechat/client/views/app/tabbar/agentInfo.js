import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import s from 'underscore.string';

import { getCustomFormTemplate } from '../customTemplates/register';
import { modal } from '../../../../../ui-utils';
import { t, APIClient } from '../../../../../utils/client';
import { hasPermission } from '../../../../../authorization';
import { dispatchToastMessage } from '../../../../../../client/lib/toast';
import './agentInfo.html';

const customFieldsTemplate = () => getCustomFormTemplate('livechatAgentInfoForm');

Template.agentInfo.helpers({
	canEdit() {
		const availableDepartments = [...Template.instance().availableDepartments.get()];
		const hasCustomFields = customFieldsTemplate() !== null;
		return (availableDepartments.length > 0 && hasPermission('add-livechat-department-agents')) || hasCustomFields;
	},
	uid() {
		return Template.instance().agent.get()._id;
	},
	name() {
		const agent = Template.instance().agent.get();
		return agent && agent.name ? agent.name : TAPi18n.__('Unnamed');
	},

	username() {
		const agent = Template.instance().agent.get();
		return agent && agent.username;
	},

	agentStatus() {
		const agent = Template.instance().agent.get();
		const userStatus = Session.get(`user_${agent.username}_status`);
		return userStatus || TAPi18n.__('offline');
	},

	agentStatusText() {
		const agent = Template.instance().agent.get();
		if (agent && s.trim(agent.statusText)) {
			return agent.statusText;
		}

		const agentStatus = Session.get(`user_${agent.username}_status`);
		return agentStatus || TAPi18n.__('offline');
	},

	email() {
		const agent = Template.instance().agent.get();
		return agent && agent.emails && agent.emails[0] && agent.emails[0].address;
	},

	agent() {
		return Template.instance().agent.get();
	},

	hasEmails() {
		const agent = Template.instance().agent.get();
		return agent && _.isArray(agent.emails);
	},

	editingAgent() {
		return Template.instance().action.get() === 'edit';
	},

	agentToEdit() {
		const instance = Template.instance();
		const agent = instance.agent.get();
		return {
			agentId: agent && agent._id,
			back(agentId) {
				instance.action.set();
				instance.agentEdited.set(agentId);
			},
		};
	},

	agentDepartments() {
		const deptIds = Template.instance().agentDepartments.get();
		const departments = Template.instance().departments.get();
		return departments.filter(({ _id }) => deptIds.includes(_id));
	},

	customFieldsTemplate,

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

Template.agentInfo.events({
	'click .delete-agent'(e, instance) {
		e.preventDefault();

		modal.open(
			{
				title: t('Are_you_sure'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false,
			},
			() => {
				Meteor.call('livechat:removeAgent', this.username, (error) => {
					if (error) {
						dispatchToastMessage({ type: 'error', message: error });
						return;
					}

					const { tabBar, onRemoveAgent } = instance;
					tabBar.close();
					onRemoveAgent && onRemoveAgent();

					modal.open({
						title: t('Removed'),
						text: t('Agent_removed'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false,
					});
				});
			},
		);
	},
	'click .edit-agent'(e, instance) {
		e.preventDefault();
		instance.action.set('edit');
	},
});

Template.agentInfo.onCreated(async function () {
	this.agent = new ReactiveVar();
	this.ready = new ReactiveVar(false);
	this.agentEdited = new ReactiveVar();
	this.departments = new ReactiveVar([]);
	this.availableDepartments = new ReactiveVar([]);
	this.agentDepartments = new ReactiveVar([]);
	this.action = new ReactiveVar();
	this.tabBar = Template.currentData().tabBar;
	this.onRemoveAgent = Template.currentData().onRemoveAgent;

	const { departments } = await APIClient.get('/v1/livechat/department?sort={"name": 1}');
	this.departments.set(departments);
	this.availableDepartments.set(departments.filter(({ enabled }) => enabled));

	const loadAgentData = async (agentId) => {
		this.ready.set(false);
		const { user } = await APIClient.get(`/v1/livechat/users/agent/${agentId}`);
		const { departments } = await APIClient.get(`/v1/livechat/agents/${agentId}/departments`);
		this.agent.set(user);
		this.agentDepartments.set((departments || []).map((department) => department.departmentId));
		this.ready.set(true);
	};

	this.autorun(() => {
		const { agentId } = Template.currentData();
		if (agentId) {
			loadAgentData(agentId);
		}
	});

	this.autorun(() => {
		const agentEdited = this.agentEdited.get();
		if (agentEdited) {
			loadAgentData(agentEdited);
			this.agentEdited.set();
		}
	});
});
