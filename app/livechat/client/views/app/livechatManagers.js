import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';

import { modal } from '../../../../ui-utils';
import { t, handleError } from '../../../../utils';
import './livechatManagers.html';

let ManagerUsers;

Meteor.startup(function() {
	ManagerUsers = new Mongo.Collection('managerUsers');
});

Template.livechatManagers.helpers({
	managers() {
		return ManagerUsers.find({}, { sort: { name: 1 } });
	},
	emailAddress() {
		if (this.emails && this.emails.length > 0) {
			return this.emails[0].address;
		}
	},
	managerAutocompleteSettings() {
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
					exceptions: _.map(ManagerUsers.find({}, { fields: { username: 1 } }).fetch(), (user) => user.username),
				},
				selector(match) {
					return { term: match };
				},
				sort: 'username',
			}],
		};
	},
});

Template.livechatManagers.events({
	'click .remove-manager'(e/* , instance*/) {
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
			Meteor.call('livechat:removeManager', this.username, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				modal.open({
					title: t('Removed'),
					text: t('Manager_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},
	'submit #form-manager'(e/* , instance*/) {
		e.preventDefault();

		if (e.currentTarget.elements.username.value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		const oldBtnValue = e.currentTarget.elements.add.value;

		e.currentTarget.elements.add.value = t('Saving');

		Meteor.call('livechat:addManager', e.currentTarget.elements.username.value, function(error/* , result*/) {
			e.currentTarget.elements.add.value = oldBtnValue;
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Manager_added'));
			e.currentTarget.reset();
		});
	},
});

Template.livechatManagers.onCreated(function() {
	this.subscribe('livechat:managers');
});
