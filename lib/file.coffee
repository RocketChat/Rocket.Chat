uploadPath = "~/uploads"

store = new FS.Store.FileSystem "images",
	path: uploadPath
	fileKeyMaker: (fileObj) ->
		filename = fileObj.name()
		filenameInStore = fileObj.name({store: 'images'})

		return filenameInStore || filename

@Images = new FS.Collection "images",
	stores: [store]

@Images.allow
	insert: ->
		return true
	update: ->
		return true
	download: ->
		return true

Meteor.startup ->
	if Meteor.isServer
		FS.HTTP.mount ['/avatar/:filename'], ->
			self = this
			opts = FS.Utility.extend({}, self.query || {}, self.params || {})

			collectionName = opts.collectionName

			collection = FS._collections['images']

			file = if collection? then collection.findOne({ "copies.images.key": opts.filename }) else null

			return {
				collection: collection
				file: file
				storeName: 'images'
				download: opts.download
				filename: opts.filename
			}
