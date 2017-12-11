import toastr from 'toastr';
Accounts.onEmailVerificationLink(function(token, done) {
	Accounts.verifyEmail(token, function(error) {
		if (error == null) {
			toastr.success(t('Email_verified'));
			Meteor.call('afterVerifyEmail');
		}
		return done();
	});
});
