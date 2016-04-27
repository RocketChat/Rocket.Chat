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

	return _.unescape description.replace /(^[“\s]*)|([”\s]*$)/g, ''


Template.oembedUrlWidget.helpers
	description: ->
		description = getDescription this
		return new Handlebars.SafeString description if _.isString description

	title: ->
		title = getTitle this
		return new Handlebars.SafeString title if _.isString title

	target: ->
		if not this.parsedUrl?.host || !document?.location?.host || this.parsedUrl.host isnt document.location.host
			return '_blank'

	image: ->
		if not this.meta?
			return

		decodedOgImage = @meta.ogImage?.replace?(/&amp;/g, '&')

		return decodedOgImage or this.meta.twitterImage

	show: ->
		return getDescription(this)? or getTitle(this)?

	collapsed: ->
		if this.collapsed?
			return this.collapsed
		else
			return Meteor.user()?.settings?.preferences?.collapseMediaByDefault is true
