Meteor.startup ->
	storeType = 'GridFS'

	if Meteor.settings?.public?.avatarStore?.type?
		storeType = Meteor.settings.public.avatarStore.type

	RocketStore = RocketFile[storeType]

	if not RocketStore?
		throw new Error "Invalid RocketStore type [#{storeType}]"

	console.log "Using #{storeType} for Avatar storage".green

	transformWrite = undefined
	if Meteor.settings?.public?.avatarStore?.size?.height?
		height = Meteor.settings.public.avatarStore.size.height
		width = Meteor.settings.public.avatarStore.size.width
		transformWrite = (file, readStream, writeStream) ->
			RocketFile.gm(readStream, file.fileName).background('#ffffff').resize(width, height+'^>').gravity('Center').extent(width, height).stream('jpeg').pipe(writeStream)

	path = "~/uploads"

	if Meteor.settings?.public?.avatarStore?.path?
		path = Meteor.settings.public.avatarStore.path

	@RocketFileAvatarInstance = new RocketStore
		name: 'avatars'
		absolutePath: path
		transformWrite: transformWrite

	HTTP.methods
		'/avatar/:username':
			'stream': true
			'get': (data) ->
				this.params.username
				file = RocketFileAvatarInstance.getFileWithReadStream this.params.username

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
