RocketChat.Migrations.add
	version: 15
	up: ->

		console.log 'Starting file migration'
		oldFilesCollection  = new Meteor.Collection 'cfs.Files.filerecord'
		oldGridFSCollection = new Meteor.Collection 'cfs_gridfs.files.files'
		oldChunkCollection  = new Meteor.Collection 'cfs_gridfs.files.chunks'

		newFilesCollection  = RocketChat.models.Uploads
		newGridFSCollection = new Meteor.Collection 'rocketchat_uploads.files'
		newChunkCollection  = new Meteor.Collection 'rocketchat_uploads.chunks'


		oldFilesCollection.find({'copies.files.key': {$exists: true}}).forEach (cfsRecord) ->
			nameParts = cfsRecord.original.name?.split('.')
			extension = ''
			url = "ufs/rocketchat_uploads/#{cfsRecord._id}"

			console.log 'migrating file', url

			if nameParts?.length > 1
				extension = nameParts.pop()
				url = url + '.' + extension

			record =
				_id: cfsRecord._id
				name: cfsRecord.original.name or ''
				size: cfsRecord.original.size
				type: cfsRecord.original.type
				complete: true
				uploading: false
				store: "rocketchat_uploads"
				extension: extension
				userId: cfsRecord.userId
				uploadedAt: cfsRecord.updatedAt
				url: Meteor.absoluteUrl() + url

			newFilesCollection.insert record

			oldGridFsFile = oldGridFSCollection.findOne({_id: new Meteor.Collection.ObjectID(cfsRecord.copies.files.key)})

			newGridFSCollection.insert
				_id: cfsRecord._id
				filename: cfsRecord._id
				contentType: oldGridFsFile.contentType
				length: oldGridFsFile.length
				chunkSize: oldGridFsFile.chunkSize
				uploadDate: oldGridFsFile.uploadDate
				aliases: null
				metadata: null
				md5: oldGridFsFile.md5

			oldChunkCollection.find({files_id: new Meteor.Collection.ObjectID(cfsRecord.copies.files.key)}).forEach (oldChunk) ->
				newChunkCollection.insert
					_id: oldChunk._id
					files_id: cfsRecord._id
					n: oldChunk.n
					data: oldChunk.data

			RocketChat.models.Messages.find({$or: [{ 'urls.url': "https://demo.rocket.chat/cfs/files/Files/#{cfsRecord._id}" }, { 'urls.url': "https://rocket.chat/cfs/files/Files/#{cfsRecord._id}" }]}).forEach (message) ->
				for urlsItem in message.urls
					if urlsItem.url is "https://demo.rocket.chat/cfs/files/Files/#{cfsRecord._id}" or urlsItem.url is "https://rocket.chat/cfs/files/Files/#{cfsRecord._id}"
						urlsItem.url = Meteor.absoluteUrl() + url
						if urlsItem.parsedUrl?.pathname?
							urlsItem.parsedUrl.pathname = "/#{url}"
						message.msg = message.msg.replace "https://demo.rocket.chat/cfs/files/Files/#{cfsRecord._id}", Meteor.absoluteUrl() + url
						message.msg = message.msg.replace "https://rocket.chat/cfs/files/Files/#{cfsRecord._id}", Meteor.absoluteUrl() + url

				RocketChat.models.Messages.update {_id: message._id}, {$set: {urls: message.urls, msg: message.msg}}

			oldFilesCollection.remove  _id: cfsRecord._id
			oldGridFSCollection.remove _id: oldGridFsFile._id
			oldChunkCollection.remove  files_id: new Meteor.Collection.ObjectID(cfsRecord.copies.files.key)

		console.log 'End of file migration'
