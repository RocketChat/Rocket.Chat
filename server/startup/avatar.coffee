Meteor.startup ->
	storeType = 'GridFS'

	if RocketChat.settings.get 'avatarStore_type'
		storeType = RocketChat.settings.get 'avatarStore_type'

	RocketChatStore = RocketChatFile[storeType]

	if not RocketChatStore?
		throw new Error "Invalid RocketChatStore type [#{storeType}]"

	console.log "Using #{storeType} for Avatar storage".green

	transformWrite = undefined
	if RocketChat.settings.get 'avatarStore_size_height'
		height = RocketChat.settings.get 'avatarStore_size_height'
		width = RocketChat.settings.get 'avatarStore_size_width'
		transformWrite = (file, readStream, writeStream) ->
			RocketChatFile.gm(readStream, file.fileName).background('#ffffff').resize(width, height+'^>').gravity('Center').extent(width, height).stream('jpeg').pipe(writeStream)

	path = "~/uploads"

	if RocketChat.settings.get 'avatarStore_path'
		path = RocketChat.settings.get 'avatarStore_path'

	@RocketChatFileAvatarInstance = new RocketChatStore
		name: 'avatars'
		absolutePath: path
		transformWrite: transformWrite

	HTTP.methods
		'/avatar/:username':
			'stream': true
			'get': (data) ->
				this.params.username
				file = RocketChatFileAvatarInstance.getFileWithReadStream this.params.username

				this.addHeader 'Content-Disposition', 'inline'

				if not file?
					this.setContentType 'image/gif'
					ws = this.createWriteStream()
					Meteor.defer ->
						ws.write 'R0lGODlhAQABAIAAAP///////yH5BAEHAAEALAAAAAABAAEAAAICTAEAOw==', 'base64'
						ws.end()
					return 

				this.setContentType 'image/jpeg'
				this.addHeader 'Content-Length', file.length

				file.readStream.pipe this.createWriteStream()
				return
