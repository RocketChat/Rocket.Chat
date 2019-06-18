import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import _ from 'underscore';

import { t, handleError } from '../../../../utils';
import { modal } from '../../../../ui-utils';

import './createServiceAccount.html';

Template.createServiceAccount.helpers({
	inUse() {
		return Template.instance().inUse.get();
	},
	notMatch() {
		return Template.instance().notMatch.get();
	},
	createIsDisabled() {
		const instance = Template.instance();
		const username = instance.username.get();
		const name = instance.name.get();
		const password = instance.password.get();
		const description = instance.description.get();
		const inUse = instance.inUse.get();
		const notMatch = instance.notMatch.get();
		const confirmPassword = instance.confirmPassword.get();

		if (username.length === 0 || name.length === 0 || password.length === 0 || confirmPassword.length === 0 || description.length === 0 || inUse || notMatch) {
			return 'disabled';
		}
		return '';
	},
});

Template.createServiceAccount.events({
	'input [name="username"]'(e, t) {
		const { value } = e.target;
		t.inUse.set(undefined);
		t.checkUsername(value.trim());
		t.username.set(value.trim());
	},
	'input [name="name"]'(e, t) {
		const { value } = e.target;
		t.name.set(value);
	},
	'input [name="password"]'(e, t) {
		const { value } = e.target;
		t.password.set(value);
	},
	'input [name="confirmPassword"]'(e, t) {
		const { value } = e.target;
		t.confirmPassword.set(value);
		t.matchPassword(t.password.get(), value);
	},
	'mouseover [name="password"]'(e) {
		e.target.type = 'text';
	},
	'mouseover [name="confirmPassword"]'(e) {
		e.target.type = 'text';
	},
	'mouseout [name="password"]'(e) {
		e.target.type = 'password';
	},
	'mouseout [name="confirmPassword"]'(e) {
		e.target.type = 'password';
	},
	'input [name="description"]'(e, t) {
		const { value } = e.target;
		t.description.set(value);
	},
	async 'submit #create-service-account'(event, instance) {
		event.preventDefault();
		event.stopPropagation();
		const username = instance.username.get();
		const name = instance.name.get();
		const password = instance.password.get();
		const description = instance.description.get();
		const userData = {};
		userData.username = username;
		userData.name = name;
		userData.password = password;
		userData.description = description;
		Meteor.call('addServiceAccount', userData, (error) => {
			if (error) {
				return handleError(error);
			}
			toastr.success(t('Service_account_created_successfully'));
			modal.close();
		});
	},
});

Template.createServiceAccount.onCreated(function() {
	this.username = new ReactiveVar('');
	this.name = new ReactiveVar('');
	this.password = new ReactiveVar('');
	this.confirmPassword = new ReactiveVar('');
	this.description = new ReactiveVar('');
	this.inUse = new ReactiveVar(undefined);
	this.notMatch = new ReactiveVar(false);
	this.checkUsername = _.debounce(function(name) {
		return Meteor.call('usernameExists', name, (error, result) => {
			if (error) {
				return;
			}
			this.inUse.set(result);
		});
	}, 1000);
	this.matchPassword = function(password, confirmPassword) {
		if (password !== confirmPassword) {
			this.notMatch.set(true);
		} else {
			this.notMatch.set(false);
		}
	};
});
