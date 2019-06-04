import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';

import { modal } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import { AgentUsers } from '../../collections/AgentUsers';
import './livechatAgents.html';

Template.livechatAgents.helpers({
	agents() {
		return AgentUsers.find({}, { sort: { name: 1 } });
	},
	emailAddress() {
		if (this.emails && this.emails.length > 0) {
			return this.emails[0].address;
		}
	},
	agentAutocompleteSettings() {
		return {
			limit: 10,
			// inputDelay: 300
			rules: [{
				// @TODO maybe change this 'collection' and/or template
				collection: 'UserAndRoom',
				subscription: 'userAutocomplete',
				field: 'username',
				template: Template.userSearch,
				noMatchTemplate: Template.userSearchEmpty,
				matchAll: true,
				filter: {
					exceptions: _.map(AgentUsers.find({}, { fields: { username: 1 } }).fetch(), (user) => user.username),
				},
				selector(match) {
					return { term: match };
				},
				sort: 'username',
			}],
		};
	},
});

Template.livechatAgents.events({
	'click .remove-agent'(e/* , instance*/) {
		e.preventDefault();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('livechat:removeAgent', this.username, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				modal.open({
					title: t('Removed'),
					text: t('Agent_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},
	'submit #form-agent'(e/* , instance*/) {
		e.preventDefault();

		if (e.currentTarget.elements.username.value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		const oldBtnValue = e.currentTarget.elements.add.value;

		e.currentTarget.elements.add.value = t('Saving');

		Meteor.call('livechat:addAgent', e.currentTarget.elements.username.value, function(error/* , result*/) {
			e.currentTarget.elements.add.value = oldBtnValue;
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Agent_added'));
			e.currentTarget.reset();
		});
	},
});

Template.livechatAgents.onCreated(function() {
	this.subscribe('livechat:agents');
});
