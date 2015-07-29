if FS?

	@fileStore = new FS.Store.GridFS 'files'

	fileStore.on 'stored', Meteor.bindEnvironment (storeName, fileObj) ->
		Meteor.runAsUser fileObj.userId, ->
			if not ChatMessage.findOne(fileObj.recId)?
				Meteor.call 'sendMessage',
					_id: fileObj.recId
					rid: fileObj.rid
					msg: """
						File Uploaded: *#{fileObj.original.name}*
						#{Meteor.absoluteUrl()}cfs/files/Files/#{fileObj._id}
					"""
					file:
						_id: fileObj._id

	@Files = new FS.Collection 'Files',
		stores: [fileStore],
		filter:
			maxSize: 2097152,
			allow:
				contentTypes: ['image/*']
			onInvalid: (message) ->
				if Meteor.isClient
					toastr.error message
				else
					console.log message
				return

	# Allow rules
	Files.allow
		insert: ->
			true
		update: ->
			false
		download: ->
			true
		remove: ->
			false

	Files.deny
		insert: ->
			false
		update: ->
			true
		remove: ->
			true
		download: ->
			false
