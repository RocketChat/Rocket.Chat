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
		return new Handlebars.SafeString getDescription this

	title: ->
		return new Handlebars.SafeString getTitle this

	image: ->
		if not this.meta?
			return

		decodedOgImage = @meta.ogImage?.replace?(/&amp;/g, '&')

		return decodedOgImage or this.meta.twitterImage

	show: ->
		return getDescription(this)? or getTitle(this)?
