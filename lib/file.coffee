uploadPath = "/var/www/rocket.chat/uploads"

store = new FS.Store.FileSystem "avatars",
	path: uploadPath
	fileKeyMaker: (fileObj) ->
		filename = fileObj.name()
		filenameInStore = fileObj.name({store: 'avatars'})

		return filenameInStore || filename

@Avatars = new FS.Collection "avatars",
	stores: [store]

@Avatars.allow
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

			collection = FS._collections['avatars']

			file = if collection? then collection.findOne({ "copies.avatars.key": opts.filename }) else null

			return {
				collection: collection
				file: file
				storeName: 'avatars'
				download: opts.download
				filename: opts.filename
			}
