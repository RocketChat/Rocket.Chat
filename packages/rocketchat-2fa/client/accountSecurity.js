import toastr from 'toastr';
import qrcode from 'yaqrcode';

window.qrcode = qrcode;

Template.accountSecurity.helpers({
	showImage() {
		return Template.instance().showImage.get();
	},
	imageData() {
		return Template.instance().imageData.get();
	},
	isEnabled() {
		const user = Meteor.user();
		return user && user.services && user.services.totp && user.services.totp.enabled;
	},
	isRegistering() {
		return Template.instance().state.get() === 'registering';
	}
});

Template.accountSecurity.events({
	'click .enable-2fa'(event, instance) {
		Meteor.call('enable2fa', (error, result) => {
			instance.imageData.set(qrcode(result.url, { size: 200 }));

			instance.state.set('registering');

			Meteor.defer(() => {
				instance.find('#testCode').focus();
			});
		});
	},

	'click .disable-2fa'() {
		swal({
			title: t('Two-factor_authentication'),
			text: t('Open_your_authentication_app_and_enter_the_code'),
			type: 'input',
			inputType: 'text',
			showCancelButton: true,
			closeOnConfirm: true,
			confirmButtonText: t('Verify'),
			cancelButtonText: t('Cancel')
		}, (code) => {
			if (code === false) {
				return;
			}

			Meteor.call('disable2fa', code, (error, result) => {
				if (error) {
					return toastr.error(t(error.error));
				}

				if (result) {
					toastr.success(t('Two-factor_authentication_disabled'));
				} else {
					return toastr.error(t('Invalid_two_factor_code'));
				}
			});
		});
	},

	'submit .verify-code'(event, instance) {
		event.preventDefault();

		Meteor.call('verifyTemp2FAToken', instance.find('#testCode').value, (error, result) => {
			if (result) {
				instance.find('#testCode').value = '';
				instance.state.set();
				toastr.success(t('Two-factor_authentication_enabled'));
			} else {
				toastr.error(t('Invalid_two_factor_code'));
			}
		});
	}
});

Template.accountSecurity.onCreated(function() {
	this.showImage = new ReactiveVar(false);
	this.imageData = new ReactiveVar();

	this.state = new ReactiveVar();
});
