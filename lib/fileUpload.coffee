if UploadFS?
	@fileCollection = new Mongo.Collection 'rocketchat_uploads'
	fileCollection.allow
		insert: (userId, doc) ->
			return userId

		update: (userId, doc) ->
			return userId is doc.userId

		remove: (userId, doc) ->
			return userId is doc.userId


	fileUploadMediaWhiteList = ->
		return unless RocketChat.settings.get('FileUpload_MediaTypeWhiteList')

		return _.map(RocketChat.settings.get('FileUpload_MediaTypeWhiteList').split(','), (item) -> return item.trim() )

	@fileUploadIsValidContentType = (type) ->
		list = fileUploadMediaWhiteList()

		if !list or _.contains list, type
			return true
		else
			wildCardGlob = '/*'
			wildcards = _.filter list, (item) -> return item.indexOf(wildCardGlob) > 0

			if _.contains wildcards, type.replace(/(\/.*)$/, wildCardGlob)
				return true;

		return false;

	initFileStore = ->
		Meteor.fileStore = new UploadFS.store.GridFS
			collection: fileCollection
			name: 'rocketchat_uploads'
			collectionName: 'rocketchat_uploads'
			filter: new UploadFS.Filter
				maxSize: RocketChat.settings.get('FileUpload_MaxFileSize')
				contentTypes: fileUploadMediaWhiteList()
			onFinishUpload: ->
				console.log arguments
			onRead: (fileId, file, req, res) ->
				res.setHeader 'content-disposition', "attachment; filename=\"#{ encodeURIComponent(file.name) }\""

	if Meteor.isServer
		initFileStore()
	else
		Tracker.autorun (c) ->
			if RocketChat.settings.subscription.ready()
				initFileStore()
				c.stop()
