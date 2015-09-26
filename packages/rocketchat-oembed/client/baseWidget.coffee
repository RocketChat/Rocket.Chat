Template.registerHelper 'replace', (source, find, replace, useRegex) ->
	if useRegex is true
		find = new RegExp(find)
	return source.replace(find, replace)

Template.registerHelper 'match', (source, regex) ->
	return new RegExp(regex).test(source)

Template.oembedBaseWidget.helpers
	template: ->
		# console.log this
		if this.headers?.contentType?.match(/image\/.*/)?
			return 'oembedImageWidget'

		if this.headers?.contentType?.match(/audio\/.*/)?
			return 'oembedAudioWidget'

		if this.parsedUrl?.host is 'www.youtube.com' and this.meta?.twitterPlayer?
			return 'oembedYoutubeWidget'

		if this.parsedUrl?.host is 'open.spotify.com' and this.meta?.ogAudio?
			return 'oembedSpotifyWidget'

		return 'oembedUrlWidget'
