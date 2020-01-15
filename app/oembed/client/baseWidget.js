import { Template } from 'meteor/templating';

Template.oembedBaseWidget.helpers({
	template() {
		const { url } = this;

		let contentType;
		if (url.headers) {
			contentType = url.headers.contentType;
		}

		if (url._overrideTemplate) {
			return url._overrideTemplate;
		}
		if (url.headers && contentType && contentType.match(/image\/.*/)) {
			return 'oembedImageWidget';
		}
		if (url.headers && contentType && contentType.match(/audio\/.*/)) {
			return 'oembedAudioWidget';
		}
		if ((url.headers && contentType && contentType.match(/video\/.*/)) || (url.meta && url.meta.twitterPlayerStreamContentType && url.meta.twitterPlayerStreamContentType.match(/video\/.*/))) {
			return 'oembedVideoWidget';
		}
		if (url.meta && url.meta.oembedHtml) {
			return 'oembedFrameWidget';
		}
		return 'oembedUrlWidget';
	},
});
