import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import { unescapeHTML } from '@rocket.chat/string-helpers';

const getTitle = function (self) {
	if (self.meta == null) {
		return;
	}
	return self.meta.ogTitle || self.meta.twitterTitle || self.meta.title || self.meta.pageTitle;
};

const getDescription = function (self) {
	if (self.meta == null) {
		return;
	}
	const description = self.meta.ogDescription || self.meta.twitterDescription || self.meta.description;
	if (description == null) {
		return;
	}
	return unescapeHTML(description.replace(/(^[“\s]*)|([”\s]*$)/g, ''));
};

Template.oembedUrlWidget.helpers({
	description() {
		const description = getDescription(this);
		if (_.isString(description)) {
			return description;
		}
	},
	title() {
		const title = getTitle(this);
		if (_.isString(title)) {
			return Blaze._escape(title);
		}
	},
	target() {
		if (
			!(this.parsedUrl && this.parsedUrl.host) ||
			!(document && document.location && document.location.host) ||
			(this.parsedUrl && this.parsedUrl.host !== document.location.host)
		) {
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
		url = new URL(url, `${this.parsedUrl.protocol}//${this.parsedUrl.host}`).href;
		return url;
	},
	show() {
		return getDescription(this) != null || getTitle(this) != null;
	},
});
