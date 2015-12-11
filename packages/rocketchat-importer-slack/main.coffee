# Slack Importer class
if Meteor.isClient
	Slack = undefined
else
	#Status: new = prepare method was called, started to load the zip's content
	#		 entries = entries from the import where loaded
	#		 started = the import was started
	#		 completed = the import was completed
	class Slack
		constructor: (@collection) ->
			console.log 'Initializing the Slack Importer'
			@fileTypeRegex = new RegExp 'application\/.*?zip'
			@AdmZip = Npm.require 'adm-zip'
			@users = []
			@channels = []
			@userTags = []
		prepare: (dataURI, sentContentType, fileName) =>
			if not @fileTypeRegex.test sentContentType
				throw new Error 'Invalid file uploaded to import Slack data from.'

			{image, contentType} = RocketChatFile.dataURIParse dataURI
			zip = new @AdmZip(new Buffer(image, 'base64'))
			zipEntries = zip.getEntries()

			importId = RocketChat.models.Imports.insert { 'type': 'Slack', 'ts': Date.now(), 'file': fileName, 'status': 'new', 'user': Meteor.user()._id }
			@importRecord = RocketChat.models.Imports.findOne importId

			tempChannels = []
			tempUsers = []
			tempMessages = {}
			for entry in zipEntries
				do (entry) ->
					#zipEntries.forEach (entry) =>
					if entry.entryName == 'channels.json'
						tempChannels = JSON.parse entry.getData().toString()
					else if entry.entryName == 'users.json'
						tempUsers = JSON.parse entry.getData().toString()
					else if not entry.isDirectory and entry.entryName.indexOf('/') > -1
						item = entry.entryName.split('/') #random/2015-10-04.json
						channelName = item[0] #random
						msgGroupData = item[1].split('.')[0] #2015-10-04
						if not tempMessages[channelName]
							tempMessages[channelName] = {}
						tempMessages[channelName][msgGroupData] = JSON.parse entry.getData().toString()

			# Create the records to store the data
			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'entries.users.started', 'count.users': tempUsers.length }}
			usersId = @collection.insert { 'import': importId, 'type': 'users', 'users': tempUsers }#, 'channels', channels, 'messages': messages
			@users = @collection.findOne usersId
			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'entries.users.finished', 'count.channels': tempChannels.length }}

			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'entries.channels.started' }}
			channelsId = @collection.insert { 'import': importId, 'type': 'channels', 'channels': tempChannels }#, 'messages': messages
			@channels = @collection.findOne channelsId
			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'entries.channels.finished' }}

			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'entries.messages.started' }}
			@messages = {}
			messagesCount = 0
			for channel, messagesObj of tempMessages
				if not @messages[channel]
					@messages[channel] = {}
				for date, msgs of messagesObj
					messagesCount += msgs.length
					RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': "entries.messages.started:#{channel}/#{date}" }}
					try
						messagesId = @collection.insert { 'import': importId, 'type': 'messages', 'name': "#{channel}/#{date}", 'messages': msgs }
						@messages[channel][date] = @collection.findOne messagesId
					catch error
						RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': "entries.messages.error:#{channel}/#{date}", 'error': error, 'count.messages': messagesCount }}
						return error

			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'entries', 'count.messages': messagesCount }}
			return {} =
				users: @users.users,
				channels: @channels.channels
		doImport: (data) =>
			console.log 'Doing the import for Slack!'
			start = Date.now()
			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'started' }}
			@collection.update { _id: @users._id }, { $set: { 'users': data.users }}
			@users = @collection.findOne @users._id
			@collection.update { _id: @channels._id }, { $set: { 'channels': data.channels }}
			@channels = @collection.findOne @channels._id

			for user in @users.users when user.doImport
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

			@collection.update { _id: @users._id }, { $set: { 'users': @users.users }}

			for channel in @channels.channels when channel.doImport
				existantRoom = RocketChat.models.Rooms.findOneByName channel.name
				if existantRoom or channel.is_general
					console.log channel.name, 'exists already!'
					if channel.is_general and channel.name isnt existantRoom?.name
						Meteor.call 'saveRoomName', 'GENERAL', channel.name
					channel.rocketId = if channel.is_general then 'GENERAL' else existantRoom._id
				else
					console.log channel.name, 'does not exist.'
					users = []
					for member in channel.members when member isnt channel.creator
						user = @getRocketUser member
						if user?
							users.push user.username

					userId = ''
					for user in @users.users when user.id is channel.creator
						userId = user.rocketId

					Meteor.runAsUser userId, () =>
						returned = Meteor.call 'createChannel', channel.name, users
						channel.rocketId = returned.rid
					RocketChat.models.Rooms.update { _id: channel.rocketId }, { $set: { 'ts': new Date(channel.created * 1000) }}

			@collection.update { _id: @channels._id }, { $set: { 'channels': @channels.channels }}

			for channel, messagesObj of @messages
				slackChannel = @getSlackChannelFromName channel
				if slackChannel?.doImport
					console.log channel
					room = RocketChat.models.Rooms.findOneById slackChannel.rocketId, { fields: { usernames: 1, t: 1, name: 1 } }
					for date, msgs of messagesObj
						console.log "#{channel} from #{date} length #{msgs.messages.length}"
						for message in msgs.messages
							if message.type is 'message'
								if message.subtype? and message.subtype isnt 'bot_message'
									if message.subtype is 'channel_join'
										if @getRocketUser(message.user)?
											RocketChat.models.Messages.createUserJoinWithRoomIdAndUser room._id, @getRocketUser(message.user),
												ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)
									else if message.subtype is 'channel_leave'
										if @getRocketUser(message.user)?
											RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser room._id, @getRocketUser(message.user),
												ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)
									else if message.subtype is 'me_message'
										RocketChat.sendMessage @getRocketUser(message.user), { msg: '_' + @convertSlackMessageToRocketChat(message.text) + '_', ts: new Date(parseInt(message.ts.split('.')[0]) * 1000) }, room
									else
										console.log message.subtype
								else
									msgObj =
										msg: @convertSlackMessageToRocketChat message.text
										ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)

									if message.edited?
										msgObj.ets = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000)

									RocketChat.sendMessage @getRocketUser(message.user), msgObj, room

			# loop through all the rooms and if they're deleted/archived then archive them
			# as it will void the messages if the channel is archived before hand
			for channel in @channels.channels when channel.doImport and channel.is_archived
				Meteor.call 'archiveRoom', channel.rocketId

			console.log 'Slack import completed!'.green
			RocketChat.models.Imports.update { _id: @importRecord._id }, { $set: { 'status': 'completed' }}
			return Date.now() - start
		getSlackChannelFromName: (channelName) =>
			for channel in @channels.channels when channel.name is channelName
				return channel
		getRocketUser: (slackId) =>
			for user in @users.users when user.id is slackId
				return RocketChat.models.Users.findOneById user.rocketId, { fields: { username: 1 }}
		convertSlackMessageToRocketChat: (message) =>
			#TODO: CLEAN THIS UP!!!!!!
			if message?
				message = message.replace '<!everyone>', '@all'
				message = message.replace '<!channel>', '@all'
				message = message.replace '&gt;', '<'
				message = message.replace '&gt;', '<'
				message = message.replace '&lt;', '>'
				message = message.replace '&lt;', '>'
				message = message.replace '&amp;', '&'
				message = message.replace ':simple_smile:', ':smile:'
				for userReplace in @userTags
					message = message.replace userReplace.slack, userReplace.rocket
					message = message.replace userReplace.slackLong, userReplace.rocket
				return message

RocketChat.importTool.add 'slack', Slack,
	name: 'Slack Importer'
	fileTypeRegex: new RegExp 'application\/.*?zip'
	description: 'Imports Slack\'s exported data into Rocket.Chat'
