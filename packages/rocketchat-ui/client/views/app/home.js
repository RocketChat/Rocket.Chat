Template.home.helpers({
	title() {
		return RocketChat.settings.get('Layout_Home_Title');
	},
	body() {
		return RocketChat.settings.get('Layout_Home_Body');
	},
	threadingOnHome() {
		return RocketChat.settings.get('Thread_creation_on_home');
	}
});
