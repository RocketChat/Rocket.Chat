const loginWithPassword = Meteor.loginWithPassword;

Meteor.loginWithPassword = function(email, password, cb) {
	loginWithPassword(email, password, (error) => {
		console.log(error);
		if (!error || error.error !== 'totp-required') {
			return cb(error);
		}

		swal({
			title: t('Two-factor_authentication'),
			text: t('Open_your_authentication_app_and_enter_the_code'),
			type: 'input',
			inputType: 'text',
			showCancelButton: true,
			closeOnConfirm: false,
			confirmButtonText: t('Verify'),
			cancelButtonText: t('Cancel')
		}, (code, ...args) => {
			if (code === false) {
				return cb();
			}

			console.log(code, ...args);
		});
	});
};
