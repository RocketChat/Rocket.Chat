Template.oembedUrlWidget.helpers
	description: ->
		if not this.meta?
			return

		return this.meta['ogDescription'] or this.meta['description']

	image: ->
		if not this.meta?
			return

		return this.meta['ogImage'] or this.meta['twitterImage']