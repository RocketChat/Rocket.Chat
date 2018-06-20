Template.oembedAudioWidget.helpers({
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			return RocketChat.getUserPreference(Meteor.userId(), 'collapseMediaByDefault') === true;
		}
	}
});
