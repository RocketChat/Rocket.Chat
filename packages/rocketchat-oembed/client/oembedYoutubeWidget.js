import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';

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
