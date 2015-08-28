if UploadFS?
	@fileCollection = new Mongo.Collection 'rocketchat_uploads'

	fileCollection.allow
		insert: (userId, doc) ->
			return userId

		update: (userId, doc) ->
			return userId is doc.userId

		remove: (userId, doc) ->
			return userId is doc.userId

	Meteor.fileStore = new UploadFS.store.GridFS
		collection: fileCollection
		name: 'rocketchat_uploads'
		collectionName: 'rocketchat_uploads'
		filter: new UploadFS.Filter
			maxSize: 2097152
			contentTypes: ['image/*', 'audio/*']
		onFinishUpload: ->
			console.log arguments
