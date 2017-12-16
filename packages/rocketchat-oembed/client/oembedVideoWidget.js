const getTitle = function(self) {
	if (self.meta == null) {
		return;
	}
	return self.meta.ogTitle || self.meta.twitterTitle || self.meta.title || self.meta.pageTitle;
};

Template.oembedVideoWidget.helpers({
	url() {
		if (this.meta && this.meta.twitterPlayerStream) {
			return this.meta.twitterPlayerStream;
		} else if (this.url) {
			return this.url;
		}
	},
	contentType() {
		if (this.meta && this.meta.twitterPlayerStreamContentType) {
			return this.meta.twitterPlayerStreamContentType;
		} else if (this.headers && this.headers.contentType) {
			return this.headers.contentType;
		}
	},
	title() {
		return getTitle(this);
	},
	collapsed() {
		if (this.collapsed) {
			return this.collapsed;
		} else {
			const user = Meteor.user();
			return RocketChat.getUserPreference(user, 'collapseMediaByDefault') === true;
		}
	}

});
