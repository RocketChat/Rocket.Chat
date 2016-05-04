if UploadFS?
	RocketChat.models.Uploads.model.allow
		insert: (userId, doc) ->
			return userId

		update: (userId, doc) ->
			return userId is doc.userId

		remove: (userId, doc) ->
			return userId is doc.userId

	initFileStore = ->
		cookie = new Cookies()
		if Meteor.isClient
			document.cookie = 'rc_uid=' + escape(Meteor.userId()) + '; path=/'
			document.cookie = 'rc_token=' + escape(Meteor._localStorage.getItem('Meteor.loginToken')) + '; path=/'

		Meteor.fileStore = new UploadFS.store.GridFS
			collection: RocketChat.models.Uploads.model
			name: 'rocketchat_uploads'
			collectionName: 'rocketchat_uploads'
			filter: new UploadFS.Filter
				onCheck: FileUpload.validateFileUpload
			transformWrite: (readStream, writeStream, fileId, file) ->
				if RocketChatFile.enabled is false or not /^image\/.+/.test(file.type)
					return readStream.pipe writeStream

				stream = undefined

				identify = (err, data) ->
					if err?
						return stream.pipe writeStream

					file.identify =
						format: data.format
						size: data.size

					if data.Orientation? and data.Orientation not in ['', 'Unknown', 'Undefined']
						RocketChatFile.gm(stream).autoOrient().stream().pipe(writeStream)
					else
						stream.pipe writeStream

				stream = RocketChatFile.gm(readStream).identify(identify).stream()

			onRead: (fileId, file, req, res) ->
				if RocketChat.settings.get 'FileUpload_ProtectFiles'
					rawCookies = req.headers.cookie if req?.headers?.cookie?
					uid = cookie.get('rc_uid', rawCookies) if rawCookies?
					token = cookie.get('rc_token', rawCookies) if rawCookies?

					if not uid?
						uid = req.query.rc_uid
						token = req.query.rc_token

					unless uid and token and RocketChat.models.Users.findOneByIdAndLoginToken(uid, token)
						res.writeHead 403
						return false

				res.setHeader 'content-disposition', "attachment; filename=\"#{ encodeURIComponent(file.name) }\""
				return true

	Meteor.startup ->
		if Meteor.isServer
			initFileStore()
		else
			Tracker.autorun (c) ->
				if Meteor.userId() and RocketChat.settings.subscription.ready()
					initFileStore()
					c.stop()
