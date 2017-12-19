Template.oembedImageWidget.helpers({
	loadImage() {
		const user = Meteor.user();

		if (RocketChat.getUserPreference(user, 'autoImageLoad') === false && this.downloadImages == null) {
			return false;
		}
		if (Meteor.Device.isPhone() && RocketChat.getUserPreference(user, 'saveMobileBandwidth') && this.downloadImages == null) {
			return false;
		}
		return true;
	},
	collapsed() {
		if (this.collapsed != null) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return RocketChat.getUserPreference(user, 'collapseMediaByDefault') === true;
		}
	}
});
