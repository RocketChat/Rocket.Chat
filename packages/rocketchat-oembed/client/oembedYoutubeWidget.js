import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.oembedYoutubeWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return RocketChat.getUserPreference(user, 'collapseMediaByDefault') === true;
		}
	},
});
