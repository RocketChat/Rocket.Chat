URL = Npm.require('url')
QueryString = Npm.require('querystring')

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
providers.registerProvider
	urls: [new RegExp('https?://www.rdio.com/\\S+'), new RegExp('https?://rd.io/\\S+')]
	endPoint: 'https://www.rdio.com/api/oembed/?format=json&maxheight=150'
providers.registerProvider
	urls: [new RegExp('https?://www.slideshare.net/[^/]+/[^/]+')]
	endPoint: 'https://www.slideshare.net/api/oembed/2?format=json&maxheight=200'
providers.registerProvider
	urls: [new RegExp('https?://www.dailymotion.com/video/\\S+')]
	endPoint: 'https://www.dailymotion.com/services/oembed?maxheight=200'

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
			data.urlObj.port = consumerUrl.port
			data.urlObj.hostname = consumerUrl.hostname
			data.urlObj.pathname = consumerUrl.pathname
			data.urlObj.query = consumerUrl.query
			delete data.urlObj.search

RocketChat.callbacks.add 'oembed:afterParseContent', (data) ->
	if data.parsedUrl?.query?
		queryString = data.parsedUrl.query
		if _.isString data.parsedUrl.query
			queryString = QueryString.parse data.parsedUrl.query
		if queryString.url?
			url = queryString.url
			provider = providers.getProviderForUrl url
			if provider?
				if data.content?.body?
					metas = JSON.parse data.content.body;
					_.each metas, (value, key) ->
						if _.isString value
							data.meta[changeCase.camelCase('oembed_' + key)] = value
					data.meta['oembedUrl'] = url
