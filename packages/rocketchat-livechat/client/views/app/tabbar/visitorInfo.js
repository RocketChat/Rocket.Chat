Template.visitorInfo.helpers({
	user() {
		var user = Meteor.users.findOne({ 'profile.token': Template.instance().visitorToken.get() });
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
	},

	loadingNavigation() {
		return !Template.instance().pageVisited.ready();
	},

	pageVisited() {
		return LivechatPageVisited.find({ token: Template.instance().visitorToken.get() }, { sort: { ts: -1 } });
	},

	pageTitle() {
		return this.page.title || t('Empty_title');
	},

	accessDateTime() {
		return moment(this.ts).format('L LTS');
	},

	createdAt() {
		if (!this.createdAt) {
			return '';
		}
		return moment(this.createdAt).format('L LTS');
	},

	lastLogin() {
		if (!this.lastLogin) {
			return '';
		}
		return moment(this.lastLogin).format('L LTS');
	}
});

Template.visitorInfo.onCreated(function() {
	this.visitorToken = new ReactiveVar(null);

	var currentData = Template.currentData();

	if (currentData && currentData.rid) {
		this.autorun(() => {
			var room = ChatRoom.findOne(currentData.rid);
			if (room && room.v && room.v.token) {
				this.visitorToken.set(room.v.token);
			} else {
				this.visitorToken.set();
			}
		});

		this.subscribe('livechat:visitorInfo', currentData.rid);
		this.pageVisited = this.subscribe('livechat:visitorPageVisited', currentData.rid);
	}
});
