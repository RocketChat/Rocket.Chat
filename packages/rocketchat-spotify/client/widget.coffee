Template.oembedBaseWidget.onCreated () ->
	if this.data?.parsedUrl?.host is 'open.spotify.com' and this.data?.meta?.ogAudio?
		this.data._overrideTemplate = 'oembedSpotifyWidget'
