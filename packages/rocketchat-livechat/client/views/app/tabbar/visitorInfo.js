Template.visitorInfo.helpers({
	user() {
		var user = Meteor.users.findOne({ username: 'guest-54' });
		// user.ip = user.ip;

		if (user && user.userAgent) {
			var ua = new UAParser();
			ua.setUA(user.userAgent);

			user.os = ua.getOS().name + ' ' + ua.getOS().version;
			if (['Mac OS', 'iOS'].indexOf(ua.getOS().name) !== -1) {
				user.osIcon = 'icon-apple';
			} else {
				user.osIcon = 'icon-' +  ua.getOS().name.toLowerCase();
			}
			user.browser = ua.getBrowser().name + ' ' + ua.getBrowser().version;
			user.browserIcon = 'icon-' + ua.getBrowser().name.toLowerCase();
		}

		return user;
	}
});

Template.visitorInfo.onCreated(function() {
	this.autorun(() => {
		this.subscribe('livechat:visitorInfo', Session.get('openedRoom'));
	});
})
