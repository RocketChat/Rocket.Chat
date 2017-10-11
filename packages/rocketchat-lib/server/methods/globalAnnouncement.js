Meteor.methods({
	globalAnnouncementRead() {
		if (!Meteor.userId()) {
			return false; //shall always be shown unless confirmed by the logged-in-user
		}

		const settingGlobalAnnouncement = RocketChat.models.Settings.findOne({_id: 'Layout_Global_Announcement'});
		const user = RocketChat.models.Users.findOne({_id: Meteor.userId()});

		return !!user.globalAnnouncementRead && (user.globalAnnouncementRead > settingGlobalAnnouncement._updatedAt);
	},

	confirmGlobalAnnouncementRead() {
		if (!Meteor.userId()) {
			return false; //This should actually be only called for logged-in-users
		}

		return !!RocketChat.models.Users.confirmGlobalAnnouncementRead(Meteor.userId());
	}
});
