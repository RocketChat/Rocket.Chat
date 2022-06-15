import { Template } from 'meteor/templating';

import { createCollapseable } from '../../ui-utils';

createCollapseable(Template.oembedBaseWidget, (instance) => instance.data.settings.collapseMediaByDefault || false);

Template.oembedBaseWidget.helpers({
	template() {
		const { collapsedMedia } = Template.instance();
		this.collapsedMediaVar = () => collapsedMedia;
		this.collapsed = collapsedMedia.get();

		if (this.headers?.contentType?.match(/image\/.*/)) {
			return 'oembedImageWidget';
		}
		if (this.headers?.contentType?.match(/audio\/.*/)) {
			return 'oembedAudioWidget';
		}
		if (this.headers?.contentType?.match(/video\/.*/) || this.meta?.twitterPlayerStreamContentType?.match(/video\/.*/)) {
			return 'oembedVideoWidget';
		}
		if (this.meta?.oembedHtml) {
			return 'oembedFrameWidget';
		}
		return 'oembedUrlWidget';
	},
});
