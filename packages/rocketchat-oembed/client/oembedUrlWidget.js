import _ from 'underscore';

const getTitle = function(self) {
	if (self.meta == null) {
		return;
	}
	return self.meta.ogTitle || self.meta.twitterTitle || self.meta.title || self.meta.pageTitle;
};

const getDescription = function(self) {
	if (self.meta == null) {
		return;
	}
	const description = self.meta.ogDescription || self.meta.twitterDescription || self.meta.description;
	if (description == null) {
		return;
	}
	return _.unescape(description.replace(/(^[“\s]*)|([”\s]*$)/g, ''));
};

Template.oembedUrlWidget.helpers({
	description() {
		const description = getDescription(this);
		if (_.isString(description)) {
			return Blaze._escape(description);
		}
	},
	title() {
		const title = getTitle(this);
		if (_.isString(title)) {
			return Blaze._escape(title);
		}
	},
	target() {
		if (!(this.parsedUrl && this.parsedUrl.host) || !(document && document.location && document.location.host) || (this.parsedUrl && this.parsedUrl.host !== document.location.host)) {
			return '_blank';
		}
	},
	image() {
		if (this.meta == null) {
			return;
		}
		let decodedOgImage;
		if (this.meta.ogImage && this.meta.ogImage.replace) {
			decodedOgImage = this.meta.ogImage.replace(/&amp;/g, '&');
		}
		let url = decodedOgImage || this.meta.twitterImage || this.meta.msapplicationTileImage;
		if (url == null) {
			return;
		}
		if (url.indexOf('//') === 0) {
			url = `${ this.parsedUrl.protocol }${ url }`;
		} else if (url.indexOf('/') === 0 && (this.parsedUrl && this.parsedUrl.host)) {
			url = `${ this.parsedUrl.protocol }//${ this.parsedUrl.host }${ url }`;
		}
		return url;
	},
	show() {
		return (getDescription(this) != null) || (getTitle(this) != null);
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
