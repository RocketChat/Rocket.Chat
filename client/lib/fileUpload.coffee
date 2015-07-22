fileStore = new (FS.Store.GridFS)('files')
Files = new (FS.Collection) 'Files',
	stores: [fileStore],
	filter:
		maxSize: 1048576,
		allow:
			contentTypes: ['image/*']
		onInvalid: (message) ->
			toastr.error message
			return
