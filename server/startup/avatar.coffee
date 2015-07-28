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

	WebApp.connectHandlers.use '/avatar/', (req, res, next) ->
		this.params =
			username: req.url.replace(/^\//, '').replace(/\?.*$/, '')

		if this.params.username[0] isnt '@'
			file = RocketChatFileAvatarInstance.getFileWithReadStream this.params.username
		else
			this.params.username = this.params.username.replace '@', ''

		res.setHeader 'Content-Disposition', 'inline'
		res.setHeader 'Cache-Control', 'no-cache'
		res.setHeader 'Pragma', 'no-cache'
		res.setHeader 'Expires', '0'

		if not file?
			res.setHeader 'content-type', 'image/svg+xml'

			colors = ['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#FF5722','#795548','#9E9E9E','#607D8B']

			username = this.params.username.replace('.jpg', '')
			position = username.length % colors.length
			color = colors[position]

			username = username.replace(/[^A-Za-z0-9]/g, '.').replace(/\.+/g, '.').replace(/(^\.)|(\.$)/g, '')
			usernameParts = username.split('.')
			initials = ''
			if usernameParts.length > 1
				initials = _.first(usernameParts)[0] + _.last(usernameParts)[0]
			else
				initials = username.replace(/[^A-Za-z0-9]/g, '').substr(0, 2)

			initials = initials.toUpperCase()

			svg = """
			<?xml version="1.0" encoding="UTF-8" standalone="no"?>
			<svg xmlns="http://www.w3.org/2000/svg" pointer-events="none" width="50" height="50" style="width: 50px; height: 50px; background-color: #{color};">
				<text text-anchor="middle" y="50%" x="50%" dy="0.36em" pointer-events="auto" fill="#ffffff" font-family="Helvetica, Arial, Lucida Grande, sans-serif" style="font-weight: 400; font-size: 28px;">
					#{initials}
				</text>
			</svg>
			"""
			
			res.write svg
			res.end()
			return 

		res.setHeader 'content-type', 'image/jpeg'
		res.setHeader 'Content-Length', file.length

		file.readStream.pipe res
		return
