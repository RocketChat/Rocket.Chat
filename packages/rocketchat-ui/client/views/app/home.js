import { Template } from 'meteor/templating';

Template.home.helpers({
	title() {
		return RocketChat.settings.get('Layout_Home_Title');
	},
	body() {
		return RocketChat.settings.get('Layout_Home_Body');
	},
});
