getTitle = (self) ->
	if not self.meta?
		return

	return self.meta.ogTitle or self.meta.twitterTitle or self.meta.title or self.meta.pageTitle

getDescription = (self) ->
	if not self.meta?
		return

	description = self.meta.ogDescription or self.meta.twitterDescription or self.meta.description
	if not description?
		return

	return description.replace /(^“)|(”$)/g, ''


Template.oembedUrlWidget.helpers
	description: ->
		return getDescription this

	title: ->
		return getTitle this

	image: ->
		if not this.meta?
			return

		return this.meta.ogImage or this.meta.twitterImage

	show: ->
		return getDescription(this)? or getTitle(this)?
