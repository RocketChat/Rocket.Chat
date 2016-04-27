Template.adminRoomInfo.helpers
	selectedRoom: ->
		return Session.get 'adminRoomsSelected'
	canEdit: ->
		return RocketChat.authz.hasAllPermission('edit-room', @rid)
	editing: (field) ->
		return Template.instance().editing.get() is field
	notDirect: ->
		return ChatRoom.findOne(@rid, { fields: { t: 1 }})?.t isnt 'd'
	roomType: ->
		return ChatRoom.findOne(@rid, { fields: { t: 1 }})?.t
	channelSettings: ->
		return RocketChat.ChannelSettings.getOptions()
	roomTypeDescription: ->
		roomType = ChatRoom.findOne(@rid, { fields: { t: 1 }})?.t
		if roomType is 'c'
			return t('Channel')
		else if roomType is 'p'
			return t('Private_Group')
	roomName: ->
		return ChatRoom.findOne(@rid, { fields: { name: 1 }})?.name
	roomTopic: ->
		return ChatRoom.findOne(@rid, { fields: { topic: 1 }})?.topic
	archivationState: ->
		return ChatRoom.findOne(@rid, { fields: { archived: 1 }})?.archived
	archivationStateDescription: ->
		archivationState = ChatRoom.findOne(@rid, { fields: { archived: 1 }})?.archived
		if archivationState is true
			return t('Room_archivation_state_true')
		else
			return t('Room_archivation_state_false')
	canDeleteRoom: ->
		roomType = ChatRoom.findOne(@rid, { fields: { t: 1 }})?.t
		return roomType? and RocketChat.authz.hasAtLeastOnePermission("delete-#{roomType}")

Template.adminRoomInfo.events
	'click .delete': ->
		swal {
			title: t('Are_you_sure')
			text: t('Delete_Room_Warning')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_delete_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		}, =>
			swal.disableButtons()

			Meteor.call 'eraseRoom', @rid, (error, result) ->
				if error
					handleError(error)
					swal.enableButtons()
				else
					swal
						title: t('Deleted')
						text: t('Room_has_been_deleted')
						type: 'success'
						timer: 2000
						showConfirmButton: false

	'keydown input[type=text]': (e, t) ->
		if e.keyCode is 13
			e.preventDefault()
			t.saveSetting(@rid)

	'click [data-edit]': (e, t) ->
		e.preventDefault()
		t.editing.set($(e.currentTarget).data('edit'))
		setTimeout (-> t.$('input.editing').focus().select()), 100

	'click .cancel': (e, t) ->
		e.preventDefault()
		t.editing.set()

	'click .save': (e, t) ->
		e.preventDefault()
		t.saveSetting(@rid)

Template.adminRoomInfo.onCreated ->
	@editing = new ReactiveVar

	@validateRoomType = (rid) =>
		type = @$('input[name=roomType]:checked').val()
		if type not in ['c', 'p']
			toastr.error t('error-invalid-room-type', { type: type })
		return true

	@validateRoomName = (rid) =>
		room = ChatRoom.findOne rid

		if not RocketChat.authz.hasAllPermission('edit-room', rid) or room.t not in ['c', 'p']
			toastr.error t('error-not-allowed')
			return false

		name = $('input[name=roomName]').val()

		try
			nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
		catch
			nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

		if not nameValidation.test name
			toastr.error t('error-invalid-room-name', { room_name: name })
			return false

		return true

	@validateRoomTopic = (rid) =>
		return true

	@saveSetting = (rid) =>
		switch @editing.get()
			when 'roomName'
				if @validateRoomName(rid)
					Meteor.call 'saveRoomSettings', rid, 'roomName', @$('input[name=roomName]').val(), (err, result) ->
						if err
							return handleError(err)
						toastr.success TAPi18n.__ 'Room_name_changed_successfully'
			when 'roomTopic'
				if @validateRoomTopic(rid)
					Meteor.call 'saveRoomSettings', rid, 'roomTopic', @$('input[name=roomTopic]').val(), (err, result) ->
						if err
							return handleError(err)
						toastr.success TAPi18n.__ 'Room_topic_changed_successfully'
			when 'roomType'
				if @validateRoomType(rid)
					Meteor.call 'saveRoomSettings', rid, 'roomType', @$('input[name=roomType]:checked').val(), (err, result) ->
						if err
							return handleError(err)
						toastr.success TAPi18n.__ 'Room_type_changed_successfully'
			when 'archivationState'
				if @$('input[name=archivationState]:checked').val() is 'true'
					if ChatRoom.findOne(rid)?.archived isnt true
						Meteor.call 'archiveRoom', rid, (err, results) ->
							return handleError(err) if err
							toastr.success TAPi18n.__ 'Room_archived'
				else
					if ChatRoom.findOne(rid)?.archived is true
						Meteor.call 'unarchiveRoom', rid, (err, results) ->
							return handleError(err) if err
							toastr.success TAPi18n.__ 'Room_unarchived'
		@editing.set()
