storeType = 'GridFS'
if Meteor.settings?.public?.avatarStore?.type?
	storeType = Meteor.settings.public.avatarStore.type

store = undefined

beforeWrite = (fileObj) ->
	fileObj._setInfo 'avatars', 'storeType', storeType, true

if storeType is 'FileSystem'
	path = "~/uploads"
	if Meteor.settings?.public?.avatarStore?.path?
		path = Meteor.settings.public.avatarStore.path
	console.log path

	store = new FS.Store.FileSystem "avatars",
		path: path
		beforeWrite: beforeWrite
		fileKeyMaker: (fileObj) ->
			filename = fileObj.name()
			filenameInStore = fileObj.name({store: 'avatars'})

			return filenameInStore || filename
else
	store = new FS.Store.GridFS "avatars",
		beforeWrite: beforeWrite

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

			file = if collection? then collection.findOne({ "copies.avatars.name": opts.filename, "copies.avatars.storeType": storeType }) else null

			return {
				collection: collection
				file: file
				storeName: 'avatars'
				download: opts.download
				filename: opts.filename
			}
