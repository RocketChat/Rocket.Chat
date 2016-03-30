Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.user() && Meteor.user().emails && Meteor.user().emails[0] && Meteor.user().emails[0].verified !== true && RocketChat.settings.get('Accounts_EmailVerification') === true && !Session.get('Accounts_EmailVerification_Warning')) {
			toastr.warning(TAPi18n.__('You_have_not_verified_your_email'));
			Session.set('Accounts_EmailVerification_Warning', true);
		}
	});
});
