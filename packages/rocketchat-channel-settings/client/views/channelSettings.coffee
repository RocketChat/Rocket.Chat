Template.channelSettings.helpers
	notDirect: ->
		return ChatRoom.findOne(@rid)?.t isnt 'd'
	roomType: ->
		return ChatRoom.findOne(@rid)?.t

Template.channelSettings.events
	'click .save': (e, t) ->
		e.preventDefault()

		settings =
			roomType: t.$('input[name=roomType]:checked').val()

		Meteor.call 'saveRoomSettings', t.data.rid, settings, (err, results) ->
			return toastr.error err.reason if err
			toastr.success TAPi18n.__ 'Settings_updated'


			# switch room.t
			# 	when 'c'
			# 		FlowRouter.go 'channel', name: name
			# 	when 'p'
			# 		FlowRouter.go 'group', name: name
