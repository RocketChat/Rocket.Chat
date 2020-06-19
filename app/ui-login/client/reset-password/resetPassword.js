import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import { ReactiveDict } from 'meteor/reactive-dict';

import { modal, call } from '../../../ui-utils/client';
import { t } from '../../../utils';
import { callbacks } from '../../../callbacks';

Template.resetPassword.helpers({
	disabled() {
		return Template.instance().state.get('password') ? '' : 'disabled';
	},
	requirePasswordChange() {
		const user = Meteor.user();
		if (user) {
			return user.requirePasswordChange;
		}
	},
	requirePasswordChangeReason() {
		const user = Meteor.user();
		if (user) {
			return user.requirePasswordChangeReason;
		}
	},
});

const resetPassword = (token, password) => new Promise((resolve, reject) => {
	Accounts.resetPassword(token, password, function(error, result) {
		if (!error) {
			FlowRouter.go('home');
			toastr.success(t('Password_changed_successfully'));
			callbacks.run('userPasswordReset');
			resolve(result);
		}

		if (error.error !== 'totp-required') {
			reject(error);
		}

		toastr.success(t('Password_changed_successfully'));
		callbacks.run('userPasswordReset');
		FlowRouter.go('login');
		resolve(result);
	});
});

async function setUserPassword(password) {
	try {
		const result = await call('setUserPassword', password);
		if (!result) {
			return toastr.error(t('Error'));
		}

		Meteor.users.update({ _id: Meteor.userId() }, {
			$set: {
				requirePasswordChange: false,
			},
		});
		toastr.remove();
		toastr.success(t('Password_changed_successfully'));
	} catch (e) {
		console.error(e);
		toastr.error(t('Error'));
	}
}

Template.resetPassword.events({
	'input #newPassword'(e, i) {
		i.state.set('password', e.currentTarget.value);
	},
	async 'submit #login-card'(event, i) {
		event.preventDefault();

		const password = i.state.get('password');
		const token = FlowRouter.getParam('token');

		if (!password || !password.trim()) {
			return;
		}

		i.state.set('loading', true);

		try {
			if (Meteor.userId() && !token) {
				return setUserPassword(password);
			}
			await resetPassword(token, password);
		} catch (error) {
			modal.open({
				title: t('Error_changing_password'),
				type: 'error',
			});
		} finally {
			i.state.set('loading', false);
		}
	},
});

Template.resetPassword.onRendered(function() {
	this.find('[name=newPassword]').focus();
});

Template.resetPassword.onCreated(function() {
	this.state = new ReactiveDict({ password: '' });
});
