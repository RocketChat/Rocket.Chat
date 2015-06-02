Grid = Npm.require('gridfs-stream')
stream = Npm.require('stream')
fs = Npm.require('fs')
path = Npm.require('path')
mkdirp = Npm.require('mkdirp')

mongo = Npm.require('mongodb')
mongoUrl = process.env.MONGO_URL
# mongo = Package.mongo.MongoInternals.NpmModule
# connection = Package.mongo.MongoInternals.defaultRemoteCollectionDriver().mongo

RocketFile = {}

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


RocketFile.GridFS = class
	constructor: (@name='file') ->
		self = this
		mongoOptions = { db: { native_parser: true }, server: { auto_reconnect: true }}
		mongo.MongoClient.connect mongoUrl, mongoOptions, (err, db) ->
			self.store = new Grid(db, mongo)
			self.findOneSync = Meteor.wrapAsync RocketFileInstance.store.collection(self.name).findOne.bind RocketFileInstance.store.collection(self.name)

	findOne: (fileName) ->
		return this.findOneSync {filename: fileName}

	createWriteStream: (fileName, contentType) ->
		return this.store.createWriteStream
			filename: fileName
			mode: 'w'
			root: this.name
			content_type: contentType

	createReadStream: (fileName) ->
		return this.store.createReadStream
			filename: fileName
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
	constructor: (absolutePath='~/uploads') ->
		if absolutePath.split(path.sep)[0] is '~'
			homepath = process.env.HOME or process.env.HOMEPATH or process.env.USERPROFILE
			if homepath?
				absolutePath = absolutePath.replace '~', homepath
			else
				throw new Error('Unable to resolve "~" in path')

		this.absolutePath = path.resolve absolutePath
		mkdirp.sync this.absolutePath

	createWriteStream: (fileName, contentType) ->
		console.log path.join this.absolutePath, fileName
		return fs.createWriteStream path.join this.absolutePath, fileName

	write: (fileName, data) ->
		fs.writeFileSync(fileName, data)

	createReadStream: (fileName) ->
		return this.store.createReadStream
			filename: fileName

			# fs.createReadStream('/some/path').pipe(writestream)