store = new FS.Store.FileSystem "images",
	path: "~/uploads"
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