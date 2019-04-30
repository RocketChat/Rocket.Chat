import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { getUserPreference } from '../../utils';

Template.oembedAudioWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		}
		return getUserPreference(Meteor.userId(), 'collapseMediaByDefault') === true;
	},
});
