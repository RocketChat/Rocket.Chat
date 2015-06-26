Template.oembedBaseWidget.helpers
	template: ->
		console.log this
		if this.headers?['content-type']?.match(/image\/.*/)?
			return 'oembedImageWidget'

		if this.parsedUrl?.host is 'www.youtube.com'
			return 'oembedYoutubeWidget'

		return 'oembedUrlWidget'