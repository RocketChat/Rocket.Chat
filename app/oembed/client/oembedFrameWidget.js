import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { getUserPreference } from '../../utils';

Template.oembedFrameWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			return getUserPreference(Meteor.userId(), 'collapseMediaByDefault') === true;
		}
	},
});
