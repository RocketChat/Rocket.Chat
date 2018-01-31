import _ from 'underscore';
import toastr from 'toastr';
let ManagerUsers;

Meteor.startup(function() {
	ManagerUsers = new Mongo.Collection('managerUsers');
});

Template.livechatUsers.helpers({
	managers() {
		return ManagerUsers.find({}, { sort: { name: 1 } });
	},
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
					exceptions: _.map(AgentUsers.find({}, { fields: { username: 1 } }).fetch(), user => { return user.username; })
				},
				selector(match) {
					return { term: match };
				},
				sort: 'username'
			}]
		};
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
					exceptions: _.map(ManagerUsers.find({}, { fields: { username: 1 } }).fetch(), user => { return user.username; })
				},
				selector(match) {
					return { term: match };
				},
				sort: 'username'
			}]
		};
	}
});

Template.livechatUsers.events({
	'click .remove-manager'(e/*, instance*/) {
		e.preventDefault();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('livechat:removeManager', this.username, function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}
				modal.open({
					title: t('Removed'),
					text: t('Manager_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	},
	'click .remove-agent'(e/*, instance*/) {
		e.preventDefault();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('livechat:removeAgent', this.username, function(error/*, result*/) {
				if (error) {
					return handleError(error);
				}
				modal.open({
					title: t('Removed'),
					text: t('Deleted'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
			});
		});
	},
	'submit #form-manager'(e/*, instance*/) {
		e.preventDefault();

		if (e.currentTarget.elements.username.value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		const oldBtnValue = e.currentTarget.elements.add.value;

		e.currentTarget.elements.add.value = t('Saving');

		Meteor.call('livechat:addManager', e.currentTarget.elements.username.value, function(error/*, result*/) {
			e.currentTarget.elements.add.value = oldBtnValue;
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Manager_added'));
			e.currentTarget.reset();
		});
	},
	'submit #form-agent'(e/*, instance*/) {
		e.preventDefault();

		if (e.currentTarget.elements.username.value.trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		const oldBtnValue = e.currentTarget.elements.add.value;

		e.currentTarget.elements.add.value = t('Saving');

		Meteor.call('livechat:addAgent', e.currentTarget.elements.username.value, function(error/*, result*/) {
			e.currentTarget.elements.add.value = oldBtnValue;
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Done'));
			e.currentTarget.reset();
		});
	}
});

Template.livechatUsers.onCreated(function() {
	this.subscribe('livechat:agents');
	this.subscribe('livechat:managers');
});
