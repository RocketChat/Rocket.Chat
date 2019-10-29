import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import s from 'underscore.string';

import { getCustomFormTemplate } from '../customTemplates/register';
import './agentInfo.html';
import { modal } from '../../../../../ui-utils';
import { t, handleError } from '../../../../../utils/client';
import { hasPermission } from '../../../../../authorization';
import { AgentUsers } from '../../../collections/AgentUsers';
import { LivechatDepartmentAgents } from '../../../collections/LivechatDepartmentAgents';
import { LivechatDepartment } from '../../../collections/LivechatDepartment';

Template.agentInfo.helpers({
	canEdit() {
		const availableDepartments = [...Template.instance().avaliableDepartments.get()];
		return availableDepartments.length > 0 && hasPermission('add-livechat-department-agents');
	},

	canRemove() {
		return hasPermission('manage-livechat-agents');
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
		const userStatus = Session.get(`user_${ agent.username }_status`);
		return userStatus || TAPi18n.__('offline');
	},

	agentStatusText() {
		const agent = Template.instance().agent.get();
		if (agent && s.trim(agent.statusText)) {
			return agent.statusText;
		}

		const agentStatus = Session.get(`user_${ agent.username }_status`);
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
		return Template.instance().editingAgent.get();
	},

	agentToEdit() {
		const instance = Template.instance();
		const agent = instance.agent.get();

		return {
			agentId: agent && agent._id,
			back() {
				instance.editingAgent.set();
			},
		};
	},

	agentDepartments() {
		return Template.instance().agentDepartments.get();
	},

	customFieldsTemplate() {
		return getCustomFormTemplate('livechatAgentInfoForm');
	},

	agentDataContext() {
		// To make the dynamic template reactive we need to pass a ReactiveVar through the data property
		// because only the dynamic template data will be reloaded
		return Template.instance().agent;
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
						return handleError(error);
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
			}
		);
	},
	'click .edit-agent'(e, instance) {
		e.preventDefault();
		instance.editingAgent.set(this._id);
	},
});

Template.agentInfo.onCreated(function() {
	this.agent = new ReactiveVar();
	this.avaliableDepartments = new ReactiveVar([]);
	this.agentDepartments = new ReactiveVar([]);
	this.editingAgent = new ReactiveVar();
	this.tabBar = Template.currentData().tabBar;
	this.onRemoveAgent = Template.currentData().onRemoveAgent;

	this.subscribe('livechat:agents');
	this.subscribe('livechat:departments', () => {
		this.avaliableDepartments.set(LivechatDepartment.find({ enabled: true }, { sort: { name: 1 } }).fetch());
	});

	this.autorun(() => {
		const { agentId } = Template.currentData();

		if (agentId) {
			const agent = AgentUsers.findOne(agentId);

			this.subscribe('livechat:departmentAgents', null, agentId, () => {
				const deptIds = LivechatDepartmentAgents.find({ agentId }).map((deptAgent) => deptAgent.departmentId);
				this.agentDepartments.set(LivechatDepartment.find({ _id: { $in: deptIds } }).fetch());
			});

			this.agent.set(agent);
		}
	});
});
