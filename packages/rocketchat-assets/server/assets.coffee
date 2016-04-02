sizeOf = Npm.require 'image-size'
mime = Npm.require 'mime-types'
crypto = Npm.require 'crypto'

mime.extensions['image/vnd.microsoft.icon'] = ['ico']

@RocketChatAssetsInstance = new RocketChatFile.GridFS
	name: 'assets'


assets =
	'logo':
		label: 'logo (svg, png)'
		defaultUrl: 'images/logo/logo.svg'
		constraints:
			type: 'image'
			extensions: ['svg', 'png']
			width: undefined
			height: undefined
	'favicon':
		label: 'favicon.ico'
		defaultUrl: 'favicon.ico'
		constraints:
			type: 'image'
			extensions: ['ico']
			width: undefined
			height: undefined
	'favicon':
		label: 'favicon.svg'
		defaultUrl: 'images/logo/icon.svg'
		constraints:
			type: 'image'
			extensions: ['svg']
			width: undefined
			height: undefined
	'favicon_64':
		label: 'favicon.png (64x64)'
		defaultUrl: 'images/logo/favicon-64x64.png'
		constraints:
			type: 'image'
			extensions: ['png']
			width: 64
			height: 64
	'favicon_96':
		label: 'favicon.png (96x96)'
		defaultUrl: 'images/logo/favicon-96x96.png'
		constraints:
			type: 'image'
			extensions: ['png']
			width: 96
			height: 96
	'favicon_128':
		label: 'favicon.png (128x128)'
		defaultUrl: 'images/logo/favicon-128x128.png'
		constraints:
			type: 'image'
			extensions: ['png']
			width: 128
			height: 128
	'favicon_192':
		label: 'favicon.png (192x192)'
		defaultUrl: 'images/logo/android-chrome-192x192.png'
		constraints:
			type: 'image'
			extensions: ['png']
			width: 192
			height: 192
	'favicon_256':
		label: 'favicon.png (256x256)'
		defaultUrl: 'images/logo/favicon-256x256.png'
		constraints:
			type: 'image'
			extensions: ['png']
			width: 256
			height: 256


RocketChat.settings.addGroup 'Assets'
for key, value of assets
	do (key, value) ->
		RocketChat.settings.add "Assets_#{key}", {defaultUrl: value.defaultUrl}, { type: 'asset', group: 'Assets', fileConstraints: value.constraints, i18nLabel: value.label, asset: key, public: true }

Meteor.startup ->
	forEachAsset = (key, value) ->
		RocketChat.settings.get "Assets_#{key}", (settingKey, settingValue) ->
			if settingValue is undefined
				value.cache = undefined
				return

			file = RocketChatAssetsInstance.getFileWithReadStream key
			if not file
				value.cache = undefined
				return

			data = []
			file.readStream.on 'data', Meteor.bindEnvironment (chunk) ->
				data.push chunk

			file.readStream.on 'end', Meteor.bindEnvironment ->
				data = Buffer.concat(data)
				hash = crypto.createHash('sha1').update(data).digest('hex')
				extension = settingValue.url.split('.').pop()
				value.cache =
					path: "assets/#{key}.#{extension}"
					cacheable: false
					sourceMapUrl: undefined
					where: 'client'
					type: 'asset'
					content: data
					extension: extension
					url: "/assets/#{key}.#{extension}?#{hash}"
					size: file.length
					uploadDate: file.uploadDate
					contentType: file.contentType
					hash: hash


	forEachAsset(key, value) for key, value of assets

calculateClientHash = WebAppHashing.calculateClientHash
WebAppHashing.calculateClientHash = (manifest, includeFilter, runtimeConfigOverride) ->
	for key, value of assets
		if not value.cache? && not value.defaultUrl?
			continue

		manifestItem = _.find manifest, (item) ->
			return item.path is key

		cache = {}
		if value.cache
			cache =
				path: value.cache.path
				cacheable: value.cache.cacheable
				sourceMapUrl: value.cache.sourceMapUrl
				where: value.cache.where
				type: value.cache.type
				url: value.cache.url
				size: value.cache.size
				hash: value.cache.hash

			WebAppInternals.staticFiles["/__cordova/assets/#{key}"] = value.cache
			WebAppInternals.staticFiles["/__cordova/assets/#{key}.#{value.cache.extension}"] = value.cache
		else
			extension = value.defaultUrl.split('.').pop()
			cache =
				path: "assets/#{key}.#{extension}"
				cacheable: false
				sourceMapUrl: undefined
				where: 'client'
				type: 'asset'
				url: "/assets/#{key}.#{extension}?v3"
				# size: value.cache.size
				hash: 'v3'

			WebAppInternals.staticFiles["/__cordova/assets/#{key}"] = WebAppInternals.staticFiles["/__cordova/#{value.defaultUrl}"]
			WebAppInternals.staticFiles["/__cordova/assets/#{key}.#{extension}"] = WebAppInternals.staticFiles["/__cordova/#{value.defaultUrl}"]


		if manifestItem?
			index = manifest.indexOf(manifestItem)

			manifest[index] = cache
		else
			manifest.push cache

	return calculateClientHash.call this, manifest, includeFilter, runtimeConfigOverride


Meteor.methods
	refreshClients: ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] unsetAsset -> Invalid user"

		hasPermission = RocketChat.authz.hasPermission Meteor.userId(), 'manage-assets'
		unless hasPermission
			throw new Meteor.Error 'manage-assets-not-allowed', "[methods] unsetAsset -> Manage assets not allowed"

		process.emit('message', {refresh: 'client'})

Meteor.methods
	unsetAsset: (asset) ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] unsetAsset -> Invalid user"

		hasPermission = RocketChat.authz.hasPermission Meteor.userId(), 'manage-assets'
		unless hasPermission
			throw new Meteor.Error 'manage-assets-not-allowed', "[methods] unsetAsset -> Manage assets not allowed"

		if not assets[asset]?
			throw new Meteor.Error "Invalid_asset"

		RocketChatAssetsInstance.deleteFile asset

		RocketChat.settings.updateById "Assets_#{asset}", {defaultUrl: assets[asset].defaultUrl}


Meteor.methods
	setAsset: (binaryContent, contentType, asset) ->
		unless Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] setAsset -> Invalid user"

		hasPermission = RocketChat.authz.hasPermission Meteor.userId(), 'manage-assets'
		unless hasPermission
			throw new Meteor.Error 'manage-assets-not-allowed', "[methods] unsetAsset -> Manage assets not allowed"

		if not assets[asset]?
			throw new Meteor.Error "Invalid_asset"

		extension = mime.extension(contentType)
		if extension not in assets[asset].constraints.extensions
			throw new Meteor.Error "Invalid_file_type", contentType

		file = new Buffer(binaryContent, 'binary')

		if assets[asset].constraints.width? or assets[asset].constraints.height?
			dimensions = sizeOf file

			if assets[asset].constraints.width? and assets[asset].constraints.width isnt dimensions.width
				throw new Meteor.Error "Invalid_file_width"

			if assets[asset].constraints.height? and assets[asset].constraints.height isnt dimensions.height
				throw new Meteor.Error "Invalid_file_height"

		rs = RocketChatFile.bufferToStream file
		RocketChatAssetsInstance.deleteFile asset
		ws = RocketChatAssetsInstance.createWriteStream asset, contentType
		ws.on 'end', Meteor.bindEnvironment ->
			Meteor.setTimeout ->
				RocketChat.settings.updateById "Assets_#{asset}", {
					url: "/assets/#{asset}.#{extension}"
					defaultUrl: assets[asset].defaultUrl
				}
			, 200

		rs.pipe ws
		return


WebApp.connectHandlers.use '/assets/', Meteor.bindEnvironment (req, res, next) ->
	params =
		asset: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')).replace(/\.[^.]*$/, '')

	file = assets[params.asset]?.cache

	if not file?
		if assets[params.asset]?.defaultUrl?
			req.url = '/'+assets[params.asset].defaultUrl
			WebAppInternals.staticFilesMiddleware WebAppInternals.staticFiles, req, res, next
		else
			res.writeHead 404
			res.end()

		return

	reqModifiedHeader = req.headers["if-modified-since"];
	if reqModifiedHeader?
		if reqModifiedHeader == file.uploadDate?.toUTCString()
			res.setHeader 'Last-Modified', reqModifiedHeader
			res.writeHead 304
			res.end()
			return

	res.setHeader 'Cache-Control', 'public, max-age=0'
	res.setHeader 'Expires', '-1'
	res.setHeader 'Last-Modified', file.uploadDate?.toUTCString() or new Date().toUTCString()
	res.setHeader 'Content-Type', file.contentType
	res.setHeader 'Content-Length', file.size

	res.writeHead 200
	res.end(file.content)
	return
