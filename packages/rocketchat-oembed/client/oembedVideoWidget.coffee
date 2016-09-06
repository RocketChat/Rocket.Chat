getTitle = (self) ->
	if not self.meta?
		return

	return self.meta.ogTitle or self.meta.twitterTitle or self.meta.title or self.meta.pageTitle


Template.oembedVideoWidget.helpers
	url: ->
		return @meta?.twitterPlayerStream or @url

	contentType: ->
		return @meta?.twitterPlayerStreamContentType or @headers?.contentType

	title: ->
		return getTitle @

	collapsed: ->
		if this.collapsed?
			return this.collapsed
		else
			return Meteor.user()?.settings?.preferences?.collapseMediaByDefault is true
