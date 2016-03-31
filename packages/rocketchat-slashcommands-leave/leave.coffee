###
# Leave is a named function that will replace /leave commands
# @param {Object} message - The message object
###

if Meteor.isClient
	RocketChat.slashCommands.add 'leave', undefined,
		description: 'Leave the current channel'
		params: ''

	RocketChat.slashCommands.add 'part', undefined,
		description: 'Leave the current channel'
		params: ''
else
	class Leave
		constructor: (command, params, item) ->
			if(command == "leave" || command == "part")
				try
					Meteor.call 'leaveRoom', item.rid
				catch
					RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
						_id: Random.id()
						rid: item.rid
						ts: new Date
						msg: TAPi18n.__('You_are_the_last_owner_Please_set_new_owner_before_leaving_the_room', null, Meteor.user().language)
					}

	RocketChat.slashCommands.add 'leave', Leave
	RocketChat.slashCommands.add 'part', Leave
