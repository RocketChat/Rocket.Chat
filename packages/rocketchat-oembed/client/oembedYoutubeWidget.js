import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { getUserPreference } from 'meteor/rocketchat:utils';

Template.oembedYoutubeWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return getUserPreference(user, 'collapseMediaByDefault') === true;
		}
	},
});
