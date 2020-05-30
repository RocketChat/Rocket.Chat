import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import moment from 'moment';

import { t } from '../../../app/utils';
import { modal, SideNav } from '../../../app/ui-utils';
import { hasAllPermission } from '../../../app/authorization';
import './personalAccessTokens.html';
import { APIClient, handleError } from '../../../app/utils/client';

const loadTokens = async (instance) => {
	const { tokens } = await APIClient.v1.get('users.getPersonalAccessTokens');
	instance.personalAccessTokens.set(tokens);
};

Template.accountTokens.helpers({
	isAllowed() {
		return hasAllPermission(['create-personal-access-tokens']);
	},
	tokens() {
		return Template.instance().personalAccessTokens.get();
	},
	dateFormated(date) {
		return moment(date).format('L LT');
	},
	twoFactor(bypassTwoFactor) {
		return bypassTwoFactor ? t('Ignore') : t('Require');
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
		const bypassTwoFactor = $('#bypassTwoFactor').val() === 'true';
		Meteor.call('personalAccessTokens:generateToken', { tokenName, bypassTwoFactor }, (error, token) => {
			if (error) {
				return handleError(error);
			}
			showSuccessModal(token);
			loadTokens(instance);
			instance.find('#tokenName').value = '';
		});
	},
	'click .remove-personal-access-token'(e, instance) {
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
					return handleError(error);
				}
				loadTokens(instance);
				toastr.success(t('Removed'));
			});
		});
	},
	'click .regenerate-personal-access-token'(e, instance) {
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
					return handleError(error);
				}
				loadTokens(instance);
				showSuccessModal(token);
			});
		});
	},
});

Template.accountTokens.onCreated(function() {
	this.personalAccessTokens = new ReactiveVar([]);

	loadTokens(this);
});

Template.accountTokens.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});
