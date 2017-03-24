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
		return false;
	},
	isRegistering() {
		return Template.instance().state.get() === 'registering';
	}
});

Template.accountSecurity.events({
	'click .enable-2fa'(event, instance) {
		console.log('enable it');

		Meteor.call('enable2fa', (error, result) => {
			// instance.showImage.set(true);

			console.log('result ->', result);

			instance.imageData.set(qrcode(result.url, { size: 200 }));

			instance.state.set('registering');
		});
	},

	'submit .verify-code'(event, instance) {
		event.preventDefault();

		Meteor.call('verifyTemp2FAToken', instance.find('#testCode').value, (error, result) => {
			// instance.showImage.set(true);
			if (error) {

			}
			if (result) {
				swal('ok');
			}
		});
	}
});

Template.accountSecurity.onCreated(function() {
	this.showImage = new ReactiveVar(false);
	this.imageData = new ReactiveVar();

	this.state = new ReactiveVar();
});
