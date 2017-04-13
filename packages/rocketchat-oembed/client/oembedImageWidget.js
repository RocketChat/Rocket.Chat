Template.oembedImageWidget.helpers({
	loadImage() {
		const user = Meteor.user();

		if (user && user.settings && user.settings.preferences && user.settings.preferences.autoImageLoad === false && this.downloadImages) {
			return false;
		}
		if (Meteor.Device.isPhone() && user() && user.settings && user.settings.preferences && user.settings.preferences.saveMobileBandwidth && this.downloadImages) {
			return false;
		}
		return true;
	},
	collapsed() {
		const user = Meteor.user();

		if (this.collapsed != null) {
			return this.collapsed;
		} else {
			return (user && user.settings && user.settings.preferences && user.settings.preferences.collapseMediaByDefault) === true;
		}
	}
});
