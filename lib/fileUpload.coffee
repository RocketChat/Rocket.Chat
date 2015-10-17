if UploadFS?
	@fileCollection = new Mongo.Collection 'rocketchat_uploads'
	fileCollection.allow
		insert: (userId, doc) ->
			return userId

		update: (userId, doc) ->
			return userId is doc.userId

		remove: (userId, doc) ->
			return userId is doc.userId

	initFileStore = ->
		Meteor.fileStore = new UploadFS.store.GridFS
			collection: fileCollection
			name: 'rocketchat_uploads'
			collectionName: 'rocketchat_uploads'
			filter: new UploadFS.Filter
				maxSize: RocketChat.settings.get('FileUpload_MaxFileSize')
				contentTypes: _.map(RocketChat.settings.get('FileUpload_MediaTypeWhiteList').split(','), (item) -> return item.trim() )
			onFinishUpload: ->
				console.log arguments
			onRead: (fileId, file, req, res) ->
				res.setHeader 'content-disposition', 'download'

	if Meteor.isServer
		initFileStore()
	else
		Tracker.autorun (c) ->
			if RocketChat.settings.subscription.ready()
				initFileStore()
				c.stop()
