import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import toastr from 'toastr';

import { settings } from '../../../../settings';
import { t, APIClient } from '../../../../utils';

import './invite.html';

Template.invite.helpers({
	isValidInvite() {
		const { inviteIsValid } = Template.instance();
		return inviteIsValid && inviteIsValid.get();
	},
	ready() {
		const instance = Template.instance();
		return typeof instance.subscriptionsReady === 'function' && instance.subscriptionsReady() && instance.hashReady && instance.hashReady.get();
	},
});

Template.invite.onCreated(function() {
	this.inviteIsValid = new ReactiveVar(false);
	this.hashReady = new ReactiveVar(false);

	const token = FlowRouter.getParam('hash');

	APIClient.v1.post('validateInviteToken', { token }).then((result) => {
		this.hashReady.set(true);

		if (!result || !result.success) {
			toastr.error(t('Failed_to_validate_invite_token'));
			return this.inviteIsValid.set(false);
		}

		if (settings.get('Accounts_RegistrationForm') !== 'Disabled') {
			Session.set('loginDefaultState', 'register');
		} else {
			Session.set('loginDefaultState', 'login');
		}
		return this.inviteIsValid.set(result.valid);
	}).catch(() => {
		toastr.error(t('Failed_to_validate_invite_token'));
		return this.inviteIsValid.set(false);
	});

	this.autorun((c) => {
		if (!this.inviteIsValid.get()) {
			return;
		}

		const user = Meteor.user();
		if (user) {
			c.stop();
			APIClient.v1.post('useInviteToken', { token }).then((result) => {
				if (!result || !result.room || !result.room.name) {
					toastr.error(t('Failed_to_activate_invite_token'));
					return;
				}

				if (result.room.t === 'p') {
					FlowRouter.go(`/group/${ result.room.name }`);
				} else {
					FlowRouter.go(`/channel/${ result.room.name }`);
				}
			}).catch(() => {
				toastr.error(t('Failed_to_activate_invite_token'));
			});
		}
	});
});

Template.invite.onRendered(function() {
	return $('#initial-page-loading').remove();
});
