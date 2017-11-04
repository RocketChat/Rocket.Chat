Template.globalAnnouncement.helpers({
	announcement() {
		return RocketChat.settings.get('Layout_Global_Announcement');
	},

	loggedId() {
		return !!Meteor.userId();
	},

	alreadyRead() {
		return Template.instance().globalAnnouncementRead.get();
	},

	hasAnnouncement() {
		return !!RocketChat.settings.get('Layout_Global_Announcement');
	}
});

Template.globalAnnouncement.events({
	'click .js-confirm-global-announcement'() {
		const instance = Template.instance();
		Meteor.call('confirmGlobalAnnouncementRead', (err, success) => {
			if (!err && success) {
				instance.globalAnnouncementRead.set(success);
			}
		});
	}
});

Template.globalAnnouncement.onCreated(function() {
	const instance = this;
	this.globalAnnouncementRead = new ReactiveVar(true); // default: Assume read in order to avoid "flashing"

	this.autorun(() => {
		Meteor.call('globalAnnouncementRead', (err, result) => {
			if (err) {
				instance.globalAnnouncementRead.set(false);
			} else {
				instance.globalAnnouncementRead.set(result);
			}
		});
	});
});
