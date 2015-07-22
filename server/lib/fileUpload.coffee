@fileStore = new (FS.Store.GridFS)('files', {})
@Files = new (FS.Collection) 'Files',
	stores: [fileStore],
	filter:
		allow:
			contentTypes: ['image/*']

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
