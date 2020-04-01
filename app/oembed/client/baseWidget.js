import { Template } from 'meteor/templating';

import { createCollapseable } from '../../ui-utils';

createCollapseable(Template.oembedBaseWidget, (instance) => instance.data.settings.collapseMediaByDefault || false);

Template.oembedBaseWidget.helpers({
	template() {
		const { collapsedMedia } = Template.instance();
		this.collapsedMediaVar = function() { return collapsedMedia; };
		this.collapsed = collapsedMedia.get();

		let contentType;
		if (this.headers) {
			contentType = this.headers.contentType;
		}

		if (this._overrideTemplate) {
			return this._overrideTemplate;
		}
		if (this.headers && contentType && contentType.match(/image\/.*/)) {
			return 'oembedImageWidget';
		}
		if (this.headers && contentType && contentType.match(/audio\/.*/)) {
			return 'oembedAudioWidget';
		}
		if ((this.headers && contentType && contentType.match(/video\/.*/)) || (this.meta && this.meta.twitterPlayerStreamContentType && this.meta.twitterPlayerStreamContentType.match(/video\/.*/))) {
			return 'oembedVideoWidget';
		}
		if (this.meta && this.meta.oembedHtml) {
			return 'oembedFrameWidget';
		}
		return 'oembedUrlWidget';
	},
});
