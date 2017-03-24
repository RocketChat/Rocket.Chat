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
		console.log('enable it');

		Meteor.call('enable2fa', (error, result) => {
			instance.imageData.set(qrcode(result.url, { size: 200 }));

			instance.state.set('registering');

			Meteor.defer(() => {
				instance.find('#testCode').focus();
			});
		});
	},

	'click .disable-2fa'() {
		Meteor.call('disable2fa', (error) => {
			if (error) {
				toastr.error(t(error.error));
			}
		});
	},

	'submit .verify-code'(event, instance) {
		event.preventDefault();

		Meteor.call('verifyTemp2FAToken', instance.find('#testCode').value, (error, result) => {
			if (result) {
				instance.find('#testCode').value = '';
				instance.state.set();
				toastr.success(t('Two-factor_authentication_enabled'));
			}
		});
	}
});

Template.accountSecurity.onCreated(function() {
	this.showImage = new ReactiveVar(false);
	this.imageData = new ReactiveVar();

	this.state = new ReactiveVar();
});
