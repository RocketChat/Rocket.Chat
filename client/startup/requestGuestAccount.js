Meteor.startup(function() {
	Tracker.autorun(function() {
		if (!Session.get('no-guest')) {
			if (!Meteor.userId()
				&& RocketChat.settings.get('Accounts_AllowGuestAccess') === true
				&& RocketChat.settings.get('Accounts_AutomaticallyLoginAsGuest')) {
				Meteor.call('getGuestAccount', function(error, user) {
					if (error) {
						console.log (error);
						return;
					}
					Meteor.loginWithPassword(user, '');
				});
			}
		}
	});
});
