RocketChat.models.Uploads = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'uploads'

		@tryEnsureIndex { 'rid': 1 }
		@tryEnsureIndex { 'uploadedAt': 1 }

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

	insertFile: (roomId, userId, store, file) ->
		fileData =
			rid: roomId
			userId: userId
			name: file.name
			size: file.size
			type: file.type
			store: store
			extension: s.strRightBack(file.name, '.')
			url: file.url
			complete: true
			uploading: false
			progress: 1
			uploadedAt: new Date()

		if @model.direct?.insert?
			file = @model.direct.insert fileData
		else
			file = @insert fileData

		return file
