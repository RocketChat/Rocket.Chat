RocketChat.Migrations.add
	version: 20
	up: ->
		###
		# Migrate existing `rocketchat_uploads` documents to include the room Id
		# where the file was uploaded to. The room Id is retrieved from the message
		# document created after the file upload.
		###

		# list of channel messages which were created after uploading a file
		msgQuery =
			rid: { $exists: true }
			'file._id': { $exists: true }
		msgOptions =
			fields:
				_id: 1
				rid: 1
				'file._id': 1
		cursorFileMessages = RocketChat.models.Messages.find(msgQuery, msgOptions);
		return unless cursorFileMessages.count()

		_.each( cursorFileMessages.fetch(), (msg) ->
			RocketChat.models.Uploads.update({ _id: msg?.file?._id }, { $set: { rid: msg.rid } }, { $multi: true })
		)

		console.log 'Updated rocketchat_uploads documents to include the room Id in which they were sent.'
