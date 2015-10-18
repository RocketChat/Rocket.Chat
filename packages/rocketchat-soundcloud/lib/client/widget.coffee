Template.oembedBaseWidget.onCreated () ->
	if this.data?.parsedUrl?.host is 'soundcloud.com' and this.data?.meta?.twitterPlayer?
		this.data._overrideTemplate = 'oembedSoundcloudWidget'
