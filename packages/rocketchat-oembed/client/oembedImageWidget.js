Template.oembedImageWidget.helpers({
	loadImage() {
		if (RocketChat.getUserPreference(Meteor.userId(), 'autoImageLoad') === false && this.downloadImages == null) {
			return false;
		}
		if (Meteor.Device.isPhone() && RocketChat.getUserPreference(Meteor.userId(), 'saveMobileBandwidth') && this.downloadImages == null) {
			return false;
		}
		return true;
	},
	collapsed() {
		if (this.collapsed != null) {
			return this.collapsed;
		} else {
			return RocketChat.getUserPreference(Meteor.userId(), 'collapseMediaByDefault') === true;
		}
	},
});
