Importer.Slack = class Importer.Slack extends Importer.Base
	constructor: (name, descriptionI18N, fileTypeRegex) ->
		super(name, descriptionI18N, fileTypeRegex)
		@userTags = []
		@bots = {}
		@logger.debug('Constructed a new Slack Importer.')

	prepare: (dataURI, sentContentType, fileName) =>
		super(dataURI, sentContentType, fileName)

		{image, contentType} = RocketChatFile.dataURIParse dataURI
		zip = new @AdmZip(new Buffer(image, 'base64'))
		zipEntries = zip.getEntries()

		tempChannels = []
		tempUsers = []
		tempMessages = {}
		for entry in zipEntries
			do (entry) =>
				if entry.entryName.indexOf('__MACOSX') > -1
					#ignore all of the files inside of __MACOSX
					@logger.debug("Ignoring the file: #{entry.entryName}")
				else if entry.entryName == 'channels.json'
					@updateProgress Importer.ProgressStep.PREPARING_CHANNELS
					tempChannels = JSON.parse entry.getData().toString()
					tempChannels = tempChannels.filter (channel) -> channel.creator?
				else if entry.entryName == 'users.json'
					@updateProgress Importer.ProgressStep.PREPARING_USERS
					tempUsers = JSON.parse entry.getData().toString()

					for user in tempUsers when user.is_bot
						@bots[user.profile.bot_id] = user

				else if not entry.isDirectory and entry.entryName.indexOf('/') > -1
					item = entry.entryName.split('/') #random/2015-10-04.json
					channelName = item[0] #random
					msgGroupData = item[1].split('.')[0] #2015-10-04
					if not tempMessages[channelName]
						tempMessages[channelName] = {}
					# Catch files which aren't valid JSON files, ignore them
					try
						tempMessages[channelName][msgGroupData] = JSON.parse entry.getData().toString()
					catch
						@logger.warn "#{entry.entryName} is not a valid JSON file! Unable to import it."

		# Insert the users record, eventually this might have to be split into several ones as well
		# if someone tries to import a several thousands users instance
		usersId = @collection.insert { 'import': @importRecord._id, 'importer': @name, 'type': 'users', 'users': tempUsers }
		@users = @collection.findOne usersId
		@updateRecord { 'count.users': tempUsers.length }
		@addCountToTotal tempUsers.length

		# Insert the channels records.
		channelsId = @collection.insert { 'import': @importRecord._id, 'importer': @name, 'type': 'channels', 'channels': tempChannels }
		@channels = @collection.findOne channelsId
		@updateRecord { 'count.channels': tempChannels.length }
		@addCountToTotal tempChannels.length

		# Insert the messages records
		@updateProgress Importer.ProgressStep.PREPARING_MESSAGES
		messagesCount = 0
		for channel, messagesObj of tempMessages
			do (channel, messagesObj) =>
				if not @messages[channel]
					@messages[channel] = {}
				for date, msgs of messagesObj
					messagesCount += msgs.length
					@updateRecord { 'messagesstatus': "#{channel}/#{date}" }

					if Importer.Base.getBSONSize(msgs) > Importer.Base.MaxBSONSize
						for splitMsg, i in Importer.Base.getBSONSafeArraysFromAnArray(msgs)
							messagesId = @collection.insert { 'import': @importRecord._id, 'importer': @name, 'type': 'messages', 'name': "#{channel}/#{date}.#{i}", 'messages': splitMsg }
							@messages[channel]["#{date}.#{i}"] = @collection.findOne messagesId
					else
						messagesId = @collection.insert { 'import': @importRecord._id, 'importer': @name, 'type': 'messages', 'name': "#{channel}/#{date}", 'messages': msgs }
						@messages[channel][date] = @collection.findOne messagesId

		@updateRecord { 'count.messages': messagesCount, 'messagesstatus': null }
		@addCountToTotal messagesCount

		if tempUsers.length is 0 or tempChannels.length is 0 or messagesCount is 0
			@logger.warn "The loaded users count #{tempUsers.length}, the loaded channels #{tempChannels.length}, and the loaded messages #{messagesCount}"
			@updateProgress Importer.ProgressStep.ERROR
			return @getProgress()

		selectionUsers = tempUsers.map (user) ->
			return new Importer.SelectionUser user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot
		selectionChannels = tempChannels.map (channel) ->
			return new Importer.SelectionChannel channel.id, channel.name, channel.is_archived, true

		@updateProgress Importer.ProgressStep.USER_SELECTION
		return new Importer.Selection @name, selectionUsers, selectionChannels

	startImport: (importSelection) =>
		super(importSelection)
		start = Date.now()

		for user in importSelection.users
			for u in @users.users when u.id is user.user_id
				u.do_import = user.do_import
		@collection.update { _id: @users._id }, { $set: { 'users': @users.users }}

		for channel in importSelection.channels
			for c in @channels.channels when c.id is channel.channel_id
				c.do_import = channel.do_import
		@collection.update { _id: @channels._id }, { $set: { 'channels': @channels.channels }}

		startedByUserId = Meteor.userId()
		Meteor.defer =>
			@updateProgress Importer.ProgressStep.IMPORTING_USERS
			for user in @users.users when user.do_import
				do (user) =>
					Meteor.runAsUser startedByUserId, () =>
						existantUser = RocketChat.models.Users.findOneByEmailAddress user.profile.email
						if existantUser
							user.rocketId = existantUser._id
							@userTags.push
								slack: "<@#{user.id}>"
								slackLong: "<@#{user.id}|#{user.name}>"
								rocket: "@#{existantUser.username}"
						else
							userId = Accounts.createUser { email: user.profile.email, password: Date.now() + user.name + user.profile.email.toUpperCase() }
							Meteor.runAsUser userId, () =>
								Meteor.call 'setUsername', user.name
								Meteor.call 'joinDefaultChannels', true
								url = null
								if user.profile.image_original
									url = user.profile.image_original
								else if user.profile.image_512
									url = user.profile.image_512
								Meteor.call 'setAvatarFromService', url, null, 'url'
								# Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600
								if user.tz_offset
									Meteor.call 'updateUserUtcOffset', user.tz_offset / 3600

							if user.profile.real_name
								RocketChat.models.Users.setName userId, user.profile.real_name
							#Deleted users are 'inactive' users in Rocket.Chat
							if user.deleted
								Meteor.call 'setUserActiveStatus', userId, false
							#TODO: Maybe send emails?
							user.rocketId = userId
							@userTags.push
								slack: "<@#{user.id}>"
								slackLong: "<@#{user.id}|#{user.name}>"
								rocket: "@#{user.name}"
						@addCountCompleted 1
			@collection.update { _id: @users._id }, { $set: { 'users': @users.users }}

			@updateProgress Importer.ProgressStep.IMPORTING_CHANNELS
			for channel in @channels.channels when channel.do_import
				do (channel) =>
					Meteor.runAsUser startedByUserId, () =>
						existantRoom = RocketChat.models.Rooms.findOneByName channel.name
						if existantRoom or channel.is_general
							if channel.is_general and channel.name isnt existantRoom?.name
								Meteor.call 'saveRoomSettings', 'GENERAL', 'roomName', channel.name
							channel.rocketId = if channel.is_general then 'GENERAL' else existantRoom._id
						else
							users = []
							for member in channel.members when member isnt channel.creator
								user = @getRocketUser member
								if user?
									users.push user.username

							userId = ''
							for user in @users.users when user.id is channel.creator
								userId = user.rocketId

							if userId is ''
								@logger.warn "Failed to find the channel creator for #{channel.name}, setting it to the current running user."
								userId = startedByUserId

							Meteor.runAsUser userId, () =>
								returned = Meteor.call 'createChannel', channel.name, users
								channel.rocketId = returned.rid

							# @TODO implement model specific function
							roomUpdate =
								ts: new Date(channel.created * 1000)

							if not _.isEmpty channel.topic?.value
								roomUpdate.topic = channel.topic.value
								lastSetTopic = channel.topic.last_set

							if not _.isEmpty(channel.purpose?.value) and channel.purpose.last_set > lastSetTopic
								roomUpdate.topic = channel.purpose.value

							RocketChat.models.Rooms.update { _id: channel.rocketId }, { $set: roomUpdate }

						@addCountCompleted 1
			@collection.update { _id: @channels._id }, { $set: { 'channels': @channels.channels }}

			missedTypes = {}
			ignoreTypes = { 'bot_add': true, 'file_comment': true, 'file_mention': true, 'channel_name': true }
			@updateProgress Importer.ProgressStep.IMPORTING_MESSAGES
			for channel, messagesObj of @messages
				do (channel, messagesObj) =>
					Meteor.runAsUser startedByUserId, () =>
						slackChannel = @getSlackChannelFromName channel
						if slackChannel?.do_import
							room = RocketChat.models.Rooms.findOneById slackChannel.rocketId, { fields: { usernames: 1, t: 1, name: 1 } }
							for date, msgs of messagesObj
								@updateRecord { 'messagesstatus': "#{channel}/#{date}.#{msgs.messages.length}" }
								for message in msgs.messages
									msgDataDefaults =
										_id: "S#{message.ts}"
										ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)

									if message.type is 'message'
										if message.subtype?
											if message.subtype is 'channel_join'
												if @getRocketUser(message.user)?
													RocketChat.models.Messages.createUserJoinWithRoomIdAndUser room._id, @getRocketUser(message.user), msgDataDefaults
											else if message.subtype is 'channel_leave'
												if @getRocketUser(message.user)?
													RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser room._id, @getRocketUser(message.user), msgDataDefaults
											else if message.subtype is 'me_message'
												msgObj =
													msg: "_#{@convertSlackMessageToRocketChat(message.text)}_"
												_.extend msgObj, msgDataDefaults
												RocketChat.sendMessage @getRocketUser(message.user), msgObj, room
											else if message.subtype is 'bot_message'
												botUser = RocketChat.models.Users.findOneById 'rocket.cat', { fields: { username: 1 }}
												botUsername = if @bots[message.bot_id] then @bots[message.bot_id]?.name else message.username
												msgObj =
													msg: @convertSlackMessageToRocketChat(message.text)
													rid: room._id
													bot: true
													attachments: message.attachments
													username: if botUsername then botUsername else undefined

												_.extend msgObj, msgDataDefaults

												if message.edited?
													msgObj.ets = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000)

												if message.icons?
													msgObj.emoji = message.icons.emoji

												RocketChat.sendMessage botUser, msgObj, room, upsert: true
											else if message.subtype is 'channel_purpose'
												RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_topic', room._id, message.purpose, @getRocketUser(message.user), msgDataDefaults
											else if message.subtype is 'channel_topic'
												RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser 'room_changed_topic', room._id, message.topic, @getRocketUser(message.user), msgDataDefaults
											else if message.subtype is 'pinned_item'
												if message.attachments
													msgObj =
														attachments: [
															"text" : @convertSlackMessageToRocketChat message.attachments[0].text
															"author_name" : message.attachments[0].author_subname
															"author_icon" : getAvatarUrlFromUsername(message.attachments[0].author_subname)
														]
													_.extend msgObj, msgDataDefaults
													RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', room._id, '', @getRocketUser(message.user), msgObj
												else
													#TODO: make this better
													@logger.debug('Pinned item with no attachment, needs work.');
													#RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', room._id, '', @getRocketUser(message.user), msgDataDefaults
											else if message.subtype is 'file_share'
												if message.file?.url_private_download isnt undefined
													details =
														message_id: "S#{message.ts}"
														name: message.file.name
														size: message.file.size
														type: message.file.mimetype
														rid: room._id
													@uploadFile details, message.file.url_private_download, @getRocketUser(message.user), room, new Date(parseInt(message.ts.split('.')[0]) * 1000)
											else
												if not missedTypes[message.subtype] and not ignoreTypes[message.subtype]
													missedTypes[message.subtype] = message
										else
											user = @getRocketUser(message.user)
											if user?
												msgObj =
													msg: @convertSlackMessageToRocketChat message.text
													rid: room._id
													u:
														_id: user._id
														username: user.username

												_.extend msgObj, msgDataDefaults

												if message.edited?
													msgObj.ets = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000)

												RocketChat.sendMessage @getRocketUser(message.user), msgObj, room, upsert: true
									@addCountCompleted 1
			console.log missedTypes
			@updateProgress Importer.ProgressStep.FINISHING
			for channel in @channels.channels when channel.do_import and channel.is_archived
				do (channel) =>
					Meteor.runAsUser startedByUserId, () =>
						Meteor.call 'archiveRoom', channel.rocketId

			@updateProgress Importer.ProgressStep.DONE
			timeTook = Date.now() - start
			@logger.log "Import took #{timeTook} milliseconds."

		return @getProgress()

	getSlackChannelFromName: (channelName) =>
		for channel in @channels.channels when channel.name is channelName
			return channel

	getRocketUser: (slackId) =>
		for user in @users.users when user.id is slackId
			return RocketChat.models.Users.findOneById user.rocketId, { fields: { username: 1 }}

	convertSlackMessageToRocketChat: (message) =>
		if message?
			message = message.replace /<!everyone>/g, '@all'
			message = message.replace /<!channel>/g, '@all'
			message = message.replace /&gt;/g, '<'
			message = message.replace /&lt;/g, '>'
			message = message.replace /&amp;/g, '&'
			message = message.replace /:simple_smile:/g, ':smile:'
			message = message.replace /:memo:/g, ':pencil:'
			message = message.replace /:piggy:/g, ':pig:'
			message = message.replace /:uk:/g, ':gb:'
			message = message.replace /<(http[s]?:[^>]*)>/g, '$1'
			for userReplace in @userTags
				message = message.replace userReplace.slack, userReplace.rocket
				message = message.replace userReplace.slackLong, userReplace.rocket
		else
			message = ''
		return message

	getSelection: () =>
		selectionUsers = @users.users.map (user) ->
			return new Importer.SelectionUser user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot
		selectionChannels = @channels.channels.map (channel) ->
			return new Importer.SelectionChannel channel.id, channel.name, channel.is_archived, true

		return new Importer.Selection @name, selectionUsers, selectionChannels
