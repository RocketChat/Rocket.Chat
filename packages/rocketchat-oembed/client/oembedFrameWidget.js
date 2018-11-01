import { Meteor } from 'meteor/meteor';

Template.oembedFrameWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			return RocketChat.getUserPreference(Meteor.userId(), 'collapseMediaByDefault') === true;
		}
	},
});
