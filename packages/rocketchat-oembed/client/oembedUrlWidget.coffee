Template.oembedUrlWidget.helpers
	description: ->
		if not this.meta?
			return

		return this.meta['ogDescription'] or this.meta['description']