Template.oembedFrameWidget.helpers({
	collapsed() {
		const user = Meteor.user();
		if (this.collapsed) {
			return this.collapsed;
		} else {
			return (user && user.settings && user.settings.preferences && user.settings.preferences.collapseMediaByDefault) === true;
		}
	}
});
