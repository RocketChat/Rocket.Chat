Template.globalAnnouncementLogin.helpers({
	hasAnnouncement() {
		return !!RocketChat.settings.get('Layout_Global_Announcement');
	}
});
