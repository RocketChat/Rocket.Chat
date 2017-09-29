Template.globalAnnouncement.helpers({
	announcement() {
		return RocketChat.settings.get('Layout_Global_Announcement');
	}
});
