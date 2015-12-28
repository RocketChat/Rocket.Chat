Template.channelSettings.helpers
	canEdit: ->
		return RocketChat.authz.hasAllPermission('edit-room', @rid)
	editing: (field) ->
		return Template.instance().editing.get() is field
	notDirect: ->
		return ChatRoom.findOne(@rid)?.t isnt 'd'
	roomType: ->
		return ChatRoom.findOne(@rid)?.t
	channelSettings: ->
		return RocketChat.ChannelSettings.getOptions()
	roomTypeDescription: ->
		roomType = ChatRoom.findOne(@rid)?.t
		if roomType is 'c'
			return t('Channel')
		else if roomType is 'p'
			return t('Private_Group')
	roomName: ->
		return ChatRoom.findOne(@rid)?.name
	roomTopic: ->
		return ChatRoom.findOne(@rid)?.topic
	archived: ->
		return ChatRoom.findOne(@rid)?.archived

Template.channelSettings.events
	'keydown input[type=text]': (e, t) ->
		if e.keyCode is 13
			e.preventDefault()
			t.saveSetting()

	'click [data-edit]': (e, t) ->
		e.preventDefault()
		t.editing.set($(e.currentTarget).data('edit'))
		setTimeout (-> t.$('input.editing').focus().select()), 100

	'click .cancel': (e, t) ->
		e.preventDefault()
		t.editing.set()

	'click .save': (e, t) ->
		e.preventDefault()
		t.saveSetting()

	'click .archive': (e, t) ->
		e.preventDefault()

		Meteor.call 'archiveRoom', t.data.rid, true, (err, results) ->
			return toastr.error err.reason if err
			toastr.success TAPi18n.__ 'Room_archived'

	'click .unarchive': (e, t) ->
		e.preventDefault()

		Meteor.call 'unarchiveRoom', t.data.rid, true, (err, results) ->
			return toastr.error err.reason if err
			toastr.success TAPi18n.__ 'Room_unarchived'

Template.channelSettings.onCreated ->
	@editing = new ReactiveVar

	@validateRoomType = =>
		type = @$('input[name=roomType]:checked').val()
		if type not in ['c', 'p']
			toastr.error t('Invalid_room_type', type)
		return true

	@validateRoomName = =>
		rid = Template.currentData()?.rid
		room = ChatRoom.findOne rid

		if not RocketChat.authz.hasAllPermission('edit-room', @rid) or room.t not in ['c', 'p']
			toastr.error t('Not_allowed')
			return false

		name = $('input[name=roomName]').val()
		if not /^[0-9a-z-_]+$/.test name
			toastr.error t('Invalid_room_name', name)
			return false

		return true

	@validateRoomTopic = =>
		return true

	@saveSetting = =>
		switch @editing.get()
			when 'roomName'
				if @validateRoomName()
					Meteor.call 'saveRoomSettings', @data?.rid, 'roomName', @$('input[name=roomName]').val(), (err, result) ->
						if err
							if err.error in [ 'duplicate-name', 'name-invalid' ]
								return toastr.error TAPi18n.__(err.reason, err.details.channelName)
							return toastr.error TAPi18n.__(err.reason)
						toastr.success TAPi18n.__ 'Room_name_changed_successfully'
			when 'roomTopic'
				if @validateRoomTopic()
					Meteor.call 'saveRoomSettings', @data?.rid, 'roomTopic', @$('input[name=roomTopic]').val(), (err, result) ->
						if err
							return toastr.error TAPi18n.__(err.reason)
						toastr.success TAPi18n.__ 'Room_topic_changed_successfully'
			when 'roomType'
				if @validateRoomType()
					Meteor.call 'saveRoomSettings', @data?.rid, 'roomType', @$('input[name=roomType]:checked').val(), (err, result) ->
						if err
							if err.error is 'invalid-room-type'
								return toastr.error TAPi18n.__(err.reason, err.details.roomType)
							return toastr.error TAPi18n.__(err.reason)
						toastr.success TAPi18n.__ 'Room_type_changed_successfully'
		@editing.set()
