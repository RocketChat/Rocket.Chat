Template.oembedUrlWidget.helpers
	description: ->
		if not this.meta?
			return


		return this.meta['og:description'] or this.meta['description']