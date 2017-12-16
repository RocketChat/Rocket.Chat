Template.oembedBaseWidget.helpers({
	template() {
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
		if (this.meta && this.meta.sandstorm && this.meta.sandstorm.grain) {
			return 'oembedSandstormGrain';
		}
		return 'oembedUrlWidget';
	}
});
