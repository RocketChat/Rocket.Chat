Template.oembedFrameWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return user && user.settings && user.settings.preferences && user.settings.preferences.collapseMediaByDefault === true;
		}
	}
});
