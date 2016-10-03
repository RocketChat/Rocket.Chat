RocketChat.models.Uploads = new class extends RocketChat.models._Base
	constructor: ->
		super('uploads')

		@tryEnsureIndex { 'rid': 1 }
		@tryEnsureIndex { 'uploadedAt': 1 }

	findOneById: (fileId) ->
		@findOne { _id: fileId }

	findNotHiddenFilesOfRoom: (roomId, limit) ->
		fileQuery =
			rid: roomId
			complete: true
			uploading: false
			_hidden:
				$ne: true

		fileOptions =
			limit: limit
			sort:
				uploadedAt: -1
			fields:
				_id: 1
				userId: 1
				rid: 1
				name: 1
				type: 1
				url: 1
				uploadedAt: 1

		return @find fileQuery, fileOptions

	insertFileInit: (roomId, userId, store, file, extra) ->
		fileData =
			rid: roomId
			userId: userId
			store: store
			complete: false
			uploading: true
			progress: 0
			extension: s.strRightBack(file.name, '.')
			uploadedAt: new Date()

		_.extend(fileData, file, extra);

		if @model.direct?.insert?
			file = @model.direct.insert fileData
		else
			file = @insert fileData

		return file

	updateFileComplete: (fileId, userId, file) ->
		if not fileId
			return

		filter =
			_id: fileId
			userId: userId

		update =
			$set:
				complete: true
				uploading: false
				progress: 1

		update.$set = _.extend file, update.$set

		if @model.direct?.insert?
			result = @model.direct.update filter, update
		else
			result = @update filter, update

		return result
