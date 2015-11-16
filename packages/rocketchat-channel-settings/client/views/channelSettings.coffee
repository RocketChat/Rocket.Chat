Template.channelSettings.helpers
	notDirect: ->
		return ChatRoom.findOne(@rid)?.t isnt 'd'
	roomType: ->
		return ChatRoom.findOne(@rid)?.t
	roomName: ->
		return ChatRoom.findOne(@rid)?.name
	roomTopic: ->
		return ChatRoom.findOne(@rid)?.topic

Template.channelSettings.events
	'click .save': (e, t) ->
		e.preventDefault()

		settings =
			roomType: t.$('input[name=roomType]:checked').val()
			roomName: t.$('input[name=roomName]').val()
			roomTopic: t.$('input[name=roomTopic]').val()

		if t.validate()
			Meteor.call 'saveRoomSettings', t.data.rid, settings, (err, results) ->
				if err
					if err.error in [ 'duplicate-name', 'name-invalid' ]
						return toastr.error TAPi18n.__(err.reason, err.details.channelName)
					if err.error is 'invalid-room-type'
						return toastr.error TAPi18n.__(err.reason, err.details.roomType)
					return toastr.error TAPi18n.__(err.reason)

				toastr.success TAPi18n.__ 'Settings_updated'

Template.channelSettings.onCreated ->
	@validateRoomType = =>
		type = @$('input[name=roomType]:checked').val()
		if type not in ['c', 'p']
			toastr.error t('Invalid_room_type', type)
		return true

	@validateRoomName = =>
		rid = Template.currentData()?.rid
		room = ChatRoom.findOne rid

		if room.u._id isnt Meteor.userId() or room.t not in ['c', 'p']
			toastr.error t('Not_allowed')
			return false

		name = $('input[name=roomName]').val()
		if not /^[0-9a-z-_]+$/.test name
			toastr.error t('Invalid_room_name', name)
			return false

		return true

	@validateRoomTopic = =>
		return true

	@validate = =>
		return @validateRoomType() and @validateRoomName() and @validateRoomTopic()
