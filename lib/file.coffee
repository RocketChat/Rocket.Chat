if Meteor.isServer
	@RocketFileInstance = new RocketFile.GridFS 'avatars'
	# @RocketFileInstance = new RocketFile.FileSystem

	HTTP.methods
		'/avatar/:username':
			'stream': true
			'get': (data) ->
				this.params.username
				file = RocketFileInstance.getFileWithReadStream this.params.username

				this.setContentType file.contentType
				this.addHeader 'Content-Disposition', 'inline'
				this.addHeader 'Content-Length', file.length

				file.readStream.pipe this.createWriteStream()
				return
  

FS.debug = false
storeType = 'GridFS'
if Meteor.settings?.public?.avatarStore?.type?
	storeType = Meteor.settings.public.avatarStore.type

store = undefined

beforeWrite = (fileObj) ->
	fileObj._setInfo 'avatars', 'storeType', storeType, true

transformWrite = (fileObj, readStream, writeStream) ->
	if Meteor.settings?.public?.avatarStore?.size?.height?
		height = Meteor.settings.public.avatarStore.size.height
		width = Meteor.settings.public.avatarStore.size.width
		gm(readStream, fileObj.name()).resize(height, width).stream().pipe(writeStream)
	else
		readStream.pipe(writeStream)

if storeType is 'FileSystem'
	path = "~/uploads"
	if Meteor.settings?.public?.avatarStore?.path?
		path = Meteor.settings.public.avatarStore.path

	store = new FS.Store.FileSystem "avatars",
		path: path
		beforeWrite: beforeWrite
		transformWrite: transformWrite
		fileKeyMaker: (fileObj) ->
			filename = fileObj.name()
			filenameInStore = fileObj.name({store: 'avatars'})

			return filenameInStore || filename
else
	store = new FS.Store.GridFS "avatars",
		beforeWrite: beforeWrite
		transformWrite: transformWrite

@Avatars = new FS.Collection "avatars",
	stores: [store]
	filter:
		allow:
			contentTypes: ['image/*']

@Avatars.allow
	insert: ->
		return true
	update: ->
		return true
	download: ->
		return true

# Meteor.startup ->
# 	if Meteor.isServer
# 		FS.HTTP.mount ['/avatar/:filename'], ->
# 			self = this
# 			opts = FS.Utility.extend({}, self.query || {}, self.params || {})

# 			collectionName = opts.collectionName

# 			collection = FS._collections['avatars']

# 			file = if collection? then collection.findOne({ "copies.avatars.name": opts.filename, "copies.avatars.storeType": storeType }) else null

# 			return {
# 				collection: collection
# 				file: file
# 				storeName: 'avatars'
# 				download: opts.download
# 				filename: opts.filename
# 			}
