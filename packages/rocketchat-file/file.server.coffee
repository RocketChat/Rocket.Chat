Grid = Npm.require('gridfs-stream')
stream = Npm.require('stream')
fs = Npm.require('fs')
path = Npm.require('path')
mkdirp = Npm.require('mkdirp')
gm = Npm.require('gm')
exec = Npm.require('child_process').exec

# Fix problem with usernames being converted to object id
Grid.prototype.tryParseObjectId = -> false

RocketChatFile =
	gm: gm
	enabled: undefined
	enable: ->
		RocketChatFile.enabled = true
		RocketChat.settings.updateOptionsById 'Accounts_AvatarResize', {alert: undefined}
	disable: ->
		RocketChatFile.enabled = false
		RocketChat.settings.updateOptionsById 'Accounts_AvatarResize', {alert: 'The_image_resize_will_not_work_because_we_can_not_detect_ImageMagick_or_GraphicsMagick_installed_in_your_server'}


detectGM = ->
	exec 'gm version', Meteor.bindEnvironment (error, stdout, stderr) ->
		if not error? and stdout.indexOf('GraphicsMagick') > -1
			RocketChatFile.enable()

			RocketChat.Info.GraphicsMagick =
				enabled: true
				version: stdout
		else
			RocketChat.Info.GraphicsMagick =
				enabled: false

		exec 'convert -version', Meteor.bindEnvironment (error, stdout, stderr) ->
			if not error? and stdout.indexOf('ImageMagick') > -1
				if RocketChatFile.enabled isnt true
					# Enable GM to work with ImageMagick if no GraphicsMagick
					RocketChatFile.gm = RocketChatFile.gm.subClass({imageMagick: true})
					RocketChatFile.enable()

				RocketChat.Info.ImageMagick =
					enabled: true
					version: stdout
			else
				if RocketChatFile.enabled isnt true
					RocketChatFile.disable()

				RocketChat.Info.ImageMagick =
					enabled: false

detectGM()

Meteor.methods
	'detectGM': ->
		detectGM()
		return


RocketChatFile.bufferToStream = (buffer) ->
	bufferStream = new stream.PassThrough()
	bufferStream.end buffer
	return bufferStream

RocketChatFile.dataURIParse = (dataURI) ->
	imageData = dataURI.split ';base64,'
	return {
		image: imageData[1]
		contentType: imageData[0].replace('data:', '')
	}

RocketChatFile.addPassThrough = (st, fn) ->
	pass = new stream.PassThrough()
	fn pass, st
	return pass


RocketChatFile.GridFS = class
	constructor: (config={}) ->
		{name, transformWrite} = config

		name ?= 'file'

		this.name = name
		this.transformWrite = transformWrite

		mongo = Package.mongo.MongoInternals.NpmModule
		db = Package.mongo.MongoInternals.defaultRemoteCollectionDriver().mongo.db

		this.store = new Grid(db, mongo)
		this.findOneSync = Meteor.wrapAsync this.store.collection(this.name).findOne.bind this.store.collection(this.name)
		this.removeSync = Meteor.wrapAsync this.store.remove.bind this.store

		this.getFileSync = Meteor.wrapAsync this.getFile.bind this

	findOne: (fileName) ->
		return this.findOneSync {_id: fileName}

	remove: (fileName) ->
		return this.removeSync
			_id: fileName
			root: this.name

	createWriteStream: (fileName, contentType) ->
		self = this

		ws = this.store.createWriteStream
			_id: fileName
			filename: fileName
			mode: 'w'
			root: this.name
			content_type: contentType

		if self.transformWrite?
			ws = RocketChatFile.addPassThrough ws, (rs, ws) ->
				file =
					name: self.name
					fileName: fileName
					contentType: contentType

				self.transformWrite file, rs, ws

		ws.on 'close', ->
			ws.emit 'end'

		return ws

	createReadStream: (fileName) ->
		return this.store.createReadStream
			_id: fileName
			root: this.name
		return undefined

	getFileWithReadStream: (fileName) ->
		file = this.findOne fileName
		if not file?
			return undefined

		rs = this.createReadStream fileName

		return {
			readStream: rs
			contentType: file.contentType
			length: file.length
			uploadDate: file.uploadDate
		}

	getFile: (fileName, cb) ->
		file = this.getFileWithReadStream(fileName)

		if not file
			return cb()

		data = []
		file.readStream.on 'data', Meteor.bindEnvironment (chunk) ->
			data.push chunk

		file.readStream.on 'end', Meteor.bindEnvironment ->
			cb null,
				buffer: Buffer.concat(data)
				contentType: file.contentType
				length: file.length
				uploadDate: file.uploadDate

	deleteFile: (fileName) ->
		file = this.findOne fileName
		if not file?
			return undefined

		return this.remove fileName


RocketChatFile.FileSystem = class
	constructor: (config={}) ->
		{absolutePath, transformWrite} = config

		absolutePath ?= '~/uploads'

		this.transformWrite = transformWrite

		if absolutePath.split(path.sep)[0] is '~'
			homepath = process.env.HOME or process.env.HOMEPATH or process.env.USERPROFILE
			if homepath?
				absolutePath = absolutePath.replace '~', homepath
			else
				throw new Error('Unable to resolve "~" in path')

		this.absolutePath = path.resolve absolutePath
		mkdirp.sync this.absolutePath
		this.statSync = Meteor.wrapAsync fs.stat.bind fs
		this.unlinkSync = Meteor.wrapAsync fs.unlink.bind fs

		this.getFileSync = Meteor.wrapAsync this.getFile.bind this

	createWriteStream: (fileName, contentType) ->
		self = this

		ws = fs.createWriteStream path.join this.absolutePath, fileName

		if self.transformWrite?
			ws = RocketChatFile.addPassThrough ws, (rs, ws) ->
				file =
					fileName: fileName
					contentType: contentType

				self.transformWrite file, rs, ws

		ws.on 'close', ->
			ws.emit 'end'

		return ws

	createReadStream: (fileName) ->
		return fs.createReadStream path.join this.absolutePath, fileName

	stat: (fileName) ->
		return this.statSync path.join this.absolutePath, fileName

	remove: (fileName) ->
		return this.unlinkSync path.join this.absolutePath, fileName

	getFileWithReadStream: (fileName) ->
		try
			stat = this.stat fileName
			rs = this.createReadStream fileName

			return {
				readStream: rs
				# contentType: file.contentType
				length: stat.size
			}
		catch e
			return undefined

	getFile: (fileName, cb) ->
		file = this.getFileWithReadStream(fileName)

		if not file
			return cb()

		data = []
		file.readStream.on 'data', Meteor.bindEnvironment (chunk) ->
			data.push chunk

		file.readStream.on 'end', Meteor.bindEnvironment ->
			buffer: Buffer.concat(data)
				contentType: file.contentType
				length: file.length
				uploadDate: file.uploadDate

	deleteFile: (fileName) ->
		try
			stat = this.stat fileName
			return this.remove fileName
		catch e
			return undefined
