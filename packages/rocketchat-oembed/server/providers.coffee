URL = Npm.require('url')

class Providers
	providers: []

	@getConsumerUrl: (provider, url) ->
		urlObj = URL.parse provider.endPoint, true
		urlObj.query['url'] = url
		delete urlObj.search
		return URL.format urlObj

	registerProvider: (provider) ->
		this.providers.push(provider)

	getProviders: () ->
		return this.providers

	getProviderForUrl: (url) ->
		return _.find this.providers, (provider) ->
			candidate = _.find provider.urls, (re) ->
				return re.test url
			return candidate?

providers = new Providers()
providers.registerProvider
	urls: [new RegExp('https?://soundcloud.com/\\S+')]
	endPoint: 'https://soundcloud.com/oembed?format=json&maxheight=150'
providers.registerProvider
	urls: [new RegExp('https?://vimeo.com/[^/]+'), new RegExp('https?://vimeo.com/channels/[^/]+/[^/]+'), new RegExp('https://vimeo.com/groups/[^/]+/videos/[^/]+')]
	endPoint: 'https://vimeo.com/api/oembed.json?maxheight=200'
providers.registerProvider
	urls: [new RegExp('https?://www.youtube.com/\\S+'), new RegExp('https?://www.youtu.be/\\S+')]
	endPoint: 'https://www.youtube.com/oembed?maxheight=200'

RocketChat.oembed = {}
RocketChat.oembed.providers = providers

RocketChat.callbacks.add 'oembed:beforeGetUrlContent', (data) ->
	if data.parsedUrl?
		url = URL.format data.parsedUrl
		provider = providers.getProviderForUrl url
		if provider?
			consumerUrl = Providers.getConsumerUrl provider, url
			consumerUrl = URL.parse consumerUrl, true
			_.extend data.parsedUrl, consumerUrl
			data.requestOptions.port = consumerUrl.port
			data.requestOptions.hostname = consumerUrl.hostname
			data.requestOptions.path = consumerUrl.path

RocketChat.callbacks.add 'oembed:afterParseContent', (data) ->
	if data.parsedUrl?
		url = URL.format data.parsedUrl
		provider = providers.getProviderForUrl url
		if provider?
			if data.content?.body?
				metas = JSON.parse data.content.body;
				_.each metas, (value, key) ->
					if _.isString value
						data.meta[changeCase.camelCase('oembed_' + key)] = value
			if data.parsedUrl?.query?.url?
				data.meta['oembedUrl'] = data.parsedUrl.query.url
