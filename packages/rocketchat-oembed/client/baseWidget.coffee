Template.oembedBaseWidget.helpers
	template: ->
		if this._overrideTemplate
			return this._overrideTemplate

		if this.headers?.contentType?.match(/image\/.*/)?
			return 'oembedImageWidget'

		if this.headers?.contentType?.match(/audio\/.*/)?
			return 'oembedAudioWidget'

		if this.headers?.contentType?.match(/video\/.*/)? or this.meta?.twitterPlayerStreamContentType?.match(/video\/.*/)?
			return 'oembedVideoWidget'

		if this.meta?.oembedHtml?
			return 'oembedFrameWidget'

		if this.meta?.sandstorm?.grain?
			return 'oembedSandstormGrain'

		return 'oembedUrlWidget'
