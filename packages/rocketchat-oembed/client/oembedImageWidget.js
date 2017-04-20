Template.oembedImageWidget.helpers({
	loadImage() {
		const user = Meteor.user();

		if (user && user.settings && user.settings.preferences && user.settings.preferences.autoImageLoad === false && this.downloadImages == null) {
			return false;
		}
		if (Meteor.Device.isPhone() && user && user.settings && user.settings.preferences && user.settings.preferences.saveMobileBandwidth && this.downloadImages == null) {
			return false;
		}
		return true;
	},
	collapsed() {
		if (this.collapsed != null) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return user && user.settings && user.settings.preferences && user.settings.preferences.collapseMediaByDefault === true;
		}
	}
});
