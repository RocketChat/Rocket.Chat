RocketChat.API.v1.addRoute 'info', authRequired: false,
	get: -> RocketChat.Info


RocketChat.API.v1.addRoute 'me', authRequired: true,
	get: ->
		return _.pick @user, [
			'_id'
			'name'
			'emails'
			'status'
			'statusConnection'
			'username'
			'utcOffset'
			'active'
			'language'
		]


# Send Channel Message
# params
# 	channel
# 	text
# 	username
# 	as_user
# 	parse
# 	link_names
# 	attachments
# 	unfurl_links
# 	unfurl_media
# 	icon_url
# 	icon_emoji
#
# response
# 	{
# 			"ok": true,
# 			"ts": "1405895017.000506",
# 			"channel": "C024BE91L",
# 			"message": {
# 					…
# 			}
# 	}
RocketChat.API.v1.addRoute 'chat.postMessage', authRequired: true,
	get: ->
		# TODO


# Set Channel Topic
RocketChat.API.v1.addRoute 'channels.setTopic', authRequired: true,
	post: ->
		if not @bodyParams.channel?
			return RocketChat.API.v1.failure 'Body param "channel" is required'

		if not @bodyParams.topic?
			return RocketChat.API.v1.failure 'Body param "topic" is required'

		unless RocketChat.authz.hasPermission(@userId, 'edit-room', @bodyParams.channel)
			return RocketChat.API.v1.unauthorized()

		if not RocketChat.saveRoomTopic(@bodyParams.channel, @bodyParams.topic)
			return RocketChat.API.v1.failure 'invalid_channel'

		return RocketChat.API.v1.success
			topic: @bodyParams.topic


# Create Channel
RocketChat.API.v1.addRoute 'channels.create', authRequired: true,
	post: ->
		if not @bodyParams.name?
			return RocketChat.API.v1.failure 'Body param "name" is required'

		if not RocketChat.authz.hasPermission(@userId, 'create-c')
			return RocketChat.API.v1.unauthorized()

		id = undefined
		try
			Meteor.runAsUser this.userId, =>
				id = Meteor.call 'createChannel', @bodyParams.name, []
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			channel: RocketChat.models.Rooms.findOne({_id: id.rid})
