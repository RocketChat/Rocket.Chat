# Base class for all Importers.
#
# @example How to subclass an importer
# 	class ExampleImporter extends RocketChat.importTool._baseImporter
#		constructor: ->
#			super('Name of Importer', 'Description of the importer, use i18n string.', new RegExp('application\/.*?zip'))
#		prepare: (uploadedFileData, uploadedFileContentType, uploadedFileName) =>
#			super
#		startImport: (selectedUsersAndChannels) =>
#			super
#		getProgress: =>
#			#return the progress report, tbd what is expected
# @version 1.0.0
Importer.Base = class Importer.Base
	@MaxBSONSize = 8000000
	@http = Npm.require 'http'
	@https = Npm.require 'https'

	@getBSONSize: (object) ->
		# The max BSON object size we can store in MongoDB is 16777216 bytes
		# but for some reason the mongo instanace which comes with meteor
		# errors out for anything close to that size. So, we are rounding it
		# down to 8000000 bytes.
		MongoInternals.NpmModules.mongodb.module.BSON.calculateObjectSize object

	@getBSONSafeArraysFromAnArray: (theArray) ->
		BSONSize = Importer.Base.getBSONSize theArray
		maxSize = Math.floor(theArray.length / (Math.ceil(BSONSize / Importer.Base.MaxBSONSize)))
		safeArrays = []
		i = 0
		while i < theArray.length
			safeArrays.push(theArray.slice(i, i += maxSize))
		return safeArrays

	# Constructs a new importer, adding an empty collection, AdmZip property, and empty users & channels
	#
	# @param [String] name the name of the Importer
	# @param [String] description the i18n string which describes the importer
	# @param [RegExp] fileTypeRegex the regexp to validate the uploaded file type against
	#
	constructor: (@name, @description, @fileTypeRegex) ->
		@logger = new Logger("#{@name} Importer", {});
		@progress = new Importer.Progress @name
		@collection = Importer.RawImports
		@AdmZip = Npm.require 'adm-zip'
		importId = Importer.Imports.insert { 'type': @name, 'ts': Date.now(), 'status': @progress.step, 'valid': true, 'user': Meteor.user()._id }
		@importRecord = Importer.Imports.findOne importId
		@users = {}
		@channels = {}
		@messages = {}

	# Takes the uploaded file and extracts the users, channels, and messages from it.
	#
	# @param [String] dataURI a base64 string of the uploaded file
	# @param [String] sentContentType the file type
	# @param [String] fileName the name of the uploaded file
	#
	# @return [Importer.Selection] Contains two properties which are arrays of objects, `channels` and `users`.
	#
	prepare: (dataURI, sentContentType, fileName) =>
		if not @fileTypeRegex.test sentContentType
			throw new Error "Invalid file uploaded to import #{@name} data from." #TODO: Make translatable

		@updateProgress Importer.ProgressStep.PREPARING_STARTED
		@updateRecord { 'file': fileName }

	# Starts the import process. The implementing method should defer as soon as the selection is set, so the user who started the process
	# doesn't end up with a "locked" ui while meteor waits for a response. The returned object should be the progress.
	#
	# @param [Importer.Selection] selectedUsersAndChannels an object with `channels` and `users` which contains information about which users and channels to import
	#
	# @return [Importer.Progress] the progress of the import
	#
	startImport: (importSelection) =>
		if importSelection is undefined
			throw new Error "No selected users and channel data provided to the #{@name} importer." #TODO: Make translatable
		else if importSelection.users is undefined
			throw new Error "Users in the selected data wasn't found, it must but at least an empty array for the #{@name} importer." #TODO: Make translatable
		else if importSelection.channels is undefined
			throw new Error "Channels in the selected data wasn't found, it must but at least an empty array for the #{@name} importer." #TODO: Make translatable

		@updateProgress Importer.ProgressStep.IMPORTING_STARTED

	# Gets the Importer.Selection object for the import.
	#
	# @return [Importer.Selection] the users and channels selection
	getSelection: () =>
		throw new Error "Invalid 'getSelection' called on #{@name}, it must be overridden and super can not be called."

	# Gets the progress of this importer.
	#
	# @return [Importer.Progress] the progress of the import
	#
	getProgress: =>
		return @progress

	# Updates the progress step of this importer.
	#
	# @return [Importer.Progress] the progress of the import
	#
	updateProgress: (step) =>
		@progress.step = step

		@logger.debug "#{@name} is now at #{step}."
		@updateRecord { 'status': @progress.step }

		return @progress

	# Adds the passed in value to the total amount of items needed to complete.
	#
	# @return [Importer.Progress] the progress of the import
	#
	addCountToTotal: (count) =>
		@progress.count.total = @progress.count.total + count
		@updateRecord { 'count.total': @progress.count.total }

		return @progress

	# Adds the passed in value to the total amount of items completed.
	#
	# @return [Importer.Progress] the progress of the import
	#
	addCountCompleted: (count) =>
		@progress.count.completed = @progress.count.completed + count

		#Only update the database every 500 records
		#Or the completed is greater than or equal to the total amount
		if (@progress.count.completed % 500 == 0) or @progress.count.completed >= @progress.count.total
			@updateRecord { 'count.completed': @progress.count.completed }

		return @progress

	# Updates the import record with the given fields being `set`
	#
	# @return [Importer.Imports] the import record object
	#
	updateRecord: (fields) =>
		Importer.Imports.update { _id: @importRecord._id }, { $set: fields }
		@importRecord = Importer.Imports.findOne @importRecord._id

		return @importRecord

	# Uploads the file to the storage.
	#
	# @param [Object] details an object with details about the upload. name, size, type, and rid
	# @param [String] fileUrl url of the file to download/import
	# @param [Object] user the Rocket.Chat user
	# @param [Object] room the Rocket.Chat room
	# @param [Date] timeStamp the timestamp the file was uploaded
	#
	uploadFile: (details, fileUrl, user, room, timeStamp) =>
		@logger.debug "Uploading the file #{details.name} from #{fileUrl}."
		requestModule = if /https/i.test(fileUrl) then Importer.Base.https else Importer.Base.http

		requestModule.get fileUrl, Meteor.bindEnvironment((stream) ->
			fileId = Meteor.fileStore.create details
			if fileId
				Meteor.fileStore.write stream, fileId, (err, file) ->
					if err
						throw new Error(err)
					else
						url = file.url.replace(Meteor.absoluteUrl(), '/')

						attachment =
							title: "File Uploaded: #{file.name}"
							title_link: url

						if /^image\/.+/.test file.type
							attachment.image_url = url
							attachment.image_type = file.type
							attachment.image_size = file.size
							attachment.image_dimensions = file.identify?.size

						if /^audio\/.+/.test file.type
							attachment.audio_url = url
							attachment.audio_type = file.type
							attachment.audio_size = file.size

						if /^video\/.+/.test file.type
							attachment.video_url = url
							attachment.video_type = file.type
							attachment.video_size = file.size

						msg =
							rid: details.rid
							ts: timeStamp
							msg: ''
							file:
								_id: file._id
							groupable: false
							attachments: [attachment]

						if details.message_id? and (typeof details.message_id is 'string')
							msg['_id'] = details.message_id

						RocketChat.sendMessage user, msg, room
			else
				@logger.error "Failed to create the store for #{fileUrl}!!!"
		)
