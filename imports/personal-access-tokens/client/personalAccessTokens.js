import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { t } from '/app/utils';
import { modal, SideNav } from '/app/ui-utils';
import { hasAllPermission } from '/app/authorization';
import toastr from 'toastr';
import moment from 'moment';

import './personalAccessTokens.html';

const PersonalAccessTokens = new Mongo.Collection('personal_access_tokens');

Template.accountTokens.helpers({
	isAllowed() {
		return hasAllPermission(['create-personal-access-tokens']);
	},
	tokens() {
		return (PersonalAccessTokens.find({}).fetch()[0] && PersonalAccessTokens.find({}).fetch()[0].tokens) || [];
	},
	dateFormated(date) {
		return moment(date).format('L LT');
	},
});

const showSuccessModal = (token) => {
	modal.open({
		title: t('API_Personal_Access_Token_Generated'),
		text: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', { token, userId: Meteor.userId() }),
		type: 'success',
		confirmButtonColor: '#DD6B55',
		confirmButtonText: 'Ok',
		closeOnConfirm: true,
		html: true,
	}, () => {
	});
};
Template.accountTokens.events({
	'submit #form-tokens'(e, instance) {
		e.preventDefault();
		const tokenName = e.currentTarget.elements.tokenName.value.trim();
		if (tokenName === '') {
			return toastr.error(t('Please_fill_a_token_name'));
		}
		Meteor.call('personalAccessTokens:generateToken', { tokenName }, (error, token) => {
			if (error) {
				return toastr.error(t(error.error));
			}
			showSuccessModal(token);
			instance.find('#tokenName').value = '';
		});
	},
	'click .remove-personal-access-token'() {
		modal.open({
			title: t('Are_you_sure'),
			text: t('API_Personal_Access_Tokens_Remove_Modal'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false,
		}, () => {
			Meteor.call('personalAccessTokens:removeToken', {
				tokenName: this.name,
			}, (error) => {
				if (error) {
					return toastr.error(t(error.error));
				}
				toastr.success(t('Removed'));
			});
		});
	},
	'click .regenerate-personal-access-token'() {
		modal.open({
			title: t('Are_you_sure'),
			text: t('API_Personal_Access_Tokens_Regenerate_Modal'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('API_Personal_Access_Tokens_Regenerate_It'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false,
		}, () => {
			Meteor.call('personalAccessTokens:regenerateToken', {
				tokenName: this.name,
			}, (error, token) => {
				if (error) {
					return toastr.error(t(error.error));
				}
				showSuccessModal(token);
			});
		});
	},
});

Template.accountTokens.onCreated(function() {
	this.ready = new ReactiveVar(true);
	const subscription = this.subscribe('personalAccessTokens');
	this.autorun(() => {
		this.ready.set(subscription.ready());
	});
});

Template.accountTokens.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});
