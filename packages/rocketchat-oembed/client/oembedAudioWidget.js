import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.oembedAudioWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			return RocketChat.getUserPreference(Meteor.userId(), 'collapseMediaByDefault') === true;
		}
	},
});
