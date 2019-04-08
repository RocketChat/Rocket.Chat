import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';

Template.oembedFrameWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			return RocketChat.getUserPreference(Meteor.userId(), 'collapseMediaByDefault') === true;
		}
	},
});
