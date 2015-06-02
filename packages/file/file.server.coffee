Grid = Npm.require('gridfs-stream')
stream = Npm.require('stream')
fs = Npm.require('fs')
path = Npm.require('path')
mkdirp = Npm.require('mkdirp')
gm = Npm.require('gm')

RocketFile =
	gm: gm

RocketFile.bufferToStream = (buffer) ->
	bufferStream = new stream.PassThrough()
	bufferStream.end buffer 
	return bufferStream

RocketFile.dataURIParse = (dataURI) ->
	imageData = dataURI.split ';base64,'
	return {
		image: imageData[1]
		contentType: imageData[0].replace('data:', '')
	}

RocketFile.addPassThrough = (st, fn) ->
	pass = new stream.PassThrough()
	fn pass, st
	return pass


RocketFile.GridFS = class
	constructor: (config={}) ->
		{name, transformWrite} = config

		name ?= 'file'

		this.name = name
		this.transformWrite = transformWrite

		mongo = Package.mongo.MongoInternals.NpmModule
		db = Package.mongo.MongoInternals.defaultRemoteCollectionDriver().mongo.db

		this.store = new Grid(db, mongo)
		this.findOneSync = Meteor.wrapAsync this.store.collection(this.name).findOne.bind this.store.collection(this.name)

	findOne: (fileName) ->
		return this.findOneSync {_id: fileName}

	createWriteStream: (fileName, contentType) ->
		self = this

		ws = this.store.createWriteStream
			_id: fileName
			filename: fileName
			mode: 'w'
			root: this.name
			content_type: contentType

		if self.transformWrite?
			ws = RocketFile.addPassThrough ws, (rs, ws) ->
				file =
					name: self.name
					fileName: fileName
					contentType: contentType

				self.transformWrite file, rs, ws

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
		}


RocketFile.FileSystem = class
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

	createWriteStream: (fileName, contentType) ->
		self = this

		ws = fs.createWriteStream path.join this.absolutePath, fileName

		if self.transformWrite?
			ws = RocketFile.addPassThrough ws, (rs, ws) ->
				file =
					fileName: fileName
					contentType: contentType

				self.transformWrite file, rs, ws
		return ws

	createReadStream: (fileName) ->
		return fs.createReadStream path.join this.absolutePath, fileName

	stat: (fileName) ->
		return this.statSync path.join this.absolutePath, fileName

	getFileWithReadStream: (fileName) ->
		stat = this.stat fileName
		if not stat?
			return undefined

		rs = this.createReadStream fileName

		return {
			readStream: rs
			# contentType: file.contentType
			length: stat.size
		}