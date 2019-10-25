import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import s from 'underscore.string';

import './agentEdit.html';
import { AgentUsers } from '../../../collections/AgentUsers';
import { LivechatDepartmentAgents } from '../../../collections/LivechatDepartmentAgents';
import { LivechatDepartment } from '../../../collections/LivechatDepartment';

/*
import { t, handleError } from '../../../utils';
import { Roles } from '../../../models';
import { Notifications } from '../../../notifications';
import { hasAtLeastOnePermission } from '../../../authorization';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
*/

Template.agentEdit.helpers({
	canEditOrAdd() {
		// return (Template.instance().user && hasAtLeastOnePermission('edit-other-user-info')) || (!Template.instance().user && hasAtLeastOnePermission('create-user'));
	},

	agent() {
		return Template.instance().agent.get();
	},

	avatarPreview() {
		// return Template.instance().avatar.get();
	},

	availableDepartments() {
		return Template.instance().avaliableDepartments.get();
	},

	hasAvailableDepartments() {
		const availableDepartments = Template.instance().avaliableDepartments.get();
		return availableDepartments && availableDepartments.length > 0;
	},

	agentDepartments() {
		const deptIds = Template.instance().agentDepartments.get();
		return LivechatDepartment.find({ _id: { $in: deptIds } }).fetch();
	},
});

Template.agentEdit.events({
	'click .cancel'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		return this.back && this.back();
	},

	'submit form'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
	},

	'click .remove-department'(e, instance) {
		e.stopPropagation();
		const { currentTarget: { dataset: { id } } } = e;
		console.log(id);
		/*
		const availableDepartments = instance.availableDepartments.get();
		const hasAvailableDepartments = availableDepartments && availableDepartments.length > 0;
		const availableAgentDepartments = instance.availableUserTags.get();

		let tags = instance.tags.get();
		tags = tags.filter((el) => el !== tag);
		t.tags.set(tags);
		*/
	},

	'click #addDepartment'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		if ($('#departmentSelect').find(':selected').is(':disabled')) {
			return;
		}

		const tags = [...instance.tags.get()];
		const tagVal = $('#tagSelect').val();
		if (tagVal === '' || tags.indexOf(tagVal) > -1) {
			return;
		}

		tags.push(tagVal);
		instance.tags.set(tags);
		$('#tagSelect').val('placeholder');
	},
});

Template.agentEdit.onCreated(function() {
	this.agent = new ReactiveVar();
	this.agentDepartments = new ReactiveVar([]);
	this.avaliableDepartments = new ReactiveVar([]);
	this.back = Template.currentData().back;

	this.subscribe('livechat:agents');
	this.subscribe('livechat:departments', () => {
		this.avaliableDepartments.set(LivechatDepartment.find({ enabled: true }).fetch());
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
