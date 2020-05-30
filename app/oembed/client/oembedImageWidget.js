import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { getUserPreference } from '../../utils';

Template.oembedImageWidget.helpers({
	loadImage() {
		if (getUserPreference(Meteor.userId(), 'autoImageLoad') === false && this.downloadImages == null) {
			return false;
		}
		if (Meteor.Device.isPhone() && getUserPreference(Meteor.userId(), 'saveMobileBandwidth') && this.downloadImages == null) {
			return false;
		}
		return true;
	},
});
