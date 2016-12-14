# Update Channel Message
RocketChat.API.v1.addRoute 'chat.update', authRequired: true,
	post: ->
		try

			# Verify request structure
			check @bodyParams,
				messageId: String
				msg: String

			msg = RocketChat.models.Messages.findOneById(@bodyParams.messageId)

			# Ensure that message exists
			if not msg
				return RocketChat.API.v1.failure 'invalid_message'
			if not msg?.u?._id == @userId
				return RocketChat.API.v1.unauthorized 'message userId does not match logged in user'

			# Ensure that editing messages is enabled
			if not RocketChat.settings.get 'Message_AllowEditing'
				return RocketChat.API.v1.failure 'editing_disabled'

			# Update message
			Meteor.runAsUser @userId, () =>
				Meteor.call 'updateMessage', { _id: msg._id, msg: @bodyParams.msg, rid: msg.rid }
			return RocketChat.API.v1.success
				message: RocketChat.models.Messages.findOneById(@bodyParams.messageId)

		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message