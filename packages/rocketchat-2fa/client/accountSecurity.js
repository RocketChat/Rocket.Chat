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
	imageSecret() {
		return Template.instance().imageSecret.get();
	},
	isEnabled() {
		const user = Meteor.user();
		return user && user.services && user.services.totp && user.services.totp.enabled;
	},
	isRegistering() {
		return Template.instance().state.get() === 'registering';
	},
	codesRemaining() {
		if (Template.instance().codesRemaining.get()) {
			return t('You_have_n_codes_remaining', { number: Template.instance().codesRemaining.get() });
		}
	}
});

Template.accountSecurity.events({
	'click .enable-2fa'(event, instance) {
		Meteor.call('2fa:enable', (error, result) => {
			instance.imageSecret.set(result.secret);
			instance.imageData.set(qrcode(result.url, { size: 200 }));

			instance.state.set('registering');

			Meteor.defer(() => {
				instance.find('#testCode').focus();
			});
		});
	},

	'click .disable-2fa'() {
		modal.open({
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

			Meteor.call('2fa:disable', code, (error, result) => {
				if (error) {
					return toastr.error(t(error.error));
				}

				if (result) {
					toastr.success(t('Two-factor_authentication_disabled'));
				} else {
					toastr.error(t('Invalid_two_factor_code'));
				}
			});
		});
	},

	'submit .verify-code'(event, instance) {
		event.preventDefault();

		Meteor.call('2fa:validateTempToken', instance.find('#testCode').value, (error, result) => {
			if (result) {
				instance.showBackupCodes(result.codes);

				instance.find('#testCode').value = '';
				instance.state.set();
				toastr.success(t('Two-factor_authentication_enabled'));
			} else {
				toastr.error(t('Invalid_two_factor_code'));
			}
		});
	},

	'click .regenerate-codes'(event, instance) {
		modal.open({
			title: t('Two-factor_authentication'),
			text: t('Open_your_authentication_app_and_enter_the_code'),
			type: 'input',
			inputType: 'text',
			showCancelButton: true,
			closeOnConfirm: false,
			confirmButtonText: t('Verify'),
			cancelButtonText: t('Cancel')
		}, (code) => {
			if (code === false) {
				return;
			}

			Meteor.call('2fa:regenerateCodes', code, (error, result) => {
				if (error) {
					return toastr.error(t(error.error));
				}

				if (result) {
					instance.showBackupCodes(result.codes);
				} else {
					toastr.error(t('Invalid_two_factor_code'));
				}
			});
		});
	}
});

Template.accountSecurity.onCreated(function() {
	this.showImage = new ReactiveVar(false);
	this.imageData = new ReactiveVar();
	this.imageSecret = new ReactiveVar();

	this.state = new ReactiveVar();

	this.codesRemaining = new ReactiveVar();

	this.showBackupCodes = (userCodes) => {
		const backupCodes = userCodes.map((value, index) => {
			return (index + 1) % 4 === 0 && index < 11 ? `${ value }\n` : `${ value } `;
		}).join('');
		const codes = `<code class="text-center allow-text-selection">${ backupCodes }</code>`;
		modal.open({
			title: t('Backup_codes'),
			text: `${ t('Make_sure_you_have_a_copy_of_your_codes', { codes }) }`,
			html: true
		});
	};

	this.autorun(() => {
		const user = Meteor.user();
		if (user && user.services && user.services.totp && user.services.totp.enabled) {
			Meteor.call('2fa:checkCodesRemaining', (error, result) => {
				if (result) {
					this.codesRemaining.set(result.remaining);
				}
			});
		}
	});
});
