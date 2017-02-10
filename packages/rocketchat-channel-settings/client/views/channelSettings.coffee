import toastr from 'toastr'
Template.channelSettings.helpers
	toArray: (obj) ->
		arr = []
		for key, value of obj
			arr.push
				$key: key
				$value: value
		return arr

	valueOf: (obj, key) ->
		if key is 't'
			if obj[key] is 'c'
				return false

			return true
		return obj?[key]

	showSetting: (setting, room) ->
		if setting.showInDirect is false
			return room.t isnt 'd'
		return true

	settings: ->
		return Template.instance().settings

	getRoom: ->
		return ChatRoom.findOne(@rid)

	editing: (field) ->
		return Template.instance().editing.get() is field

	isDisabled: (field, room) ->
		return Template.instance().settings[field].processing.get() or !RocketChat.authz.hasAllPermission('edit-room', room._id)

	channelSettings: ->
		return RocketChat.ChannelSettings.getOptions(Template.currentData())

	unscape: (value) ->
		return s.unescapeHTML value

	canDeleteRoom: ->
		roomType = ChatRoom.findOne(@rid, { fields: { t: 1 }})?.t
		return roomType? and RocketChat.authz.hasAtLeastOnePermission("delete-#{roomType}", @rid)

	readOnly: ->
		return  ChatRoom.findOne(@rid, { fields: { ro: 1 }})?.ro

	readOnlyDescription: ->
		readOnly = ChatRoom.findOne(@rid, { fields: { ro: 1 }})?.ro
		if readOnly is true
			return t('True')
		else
			return t('False')



Template.channelSettings.events
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
			t.saveSetting()

	'click [data-edit]': (e, t) ->
		e.preventDefault()
		if $(e.currentTarget).data('edit')
			t.editing.set($(e.currentTarget).data('edit'))
			setTimeout (-> t.$('input.editing').focus().select()), 100

	'change [type="radio"]': (e, t) ->
		t.editing.set($(e.currentTarget).attr('name'))

	'change [type="checkbox"]': (e, t) ->
		t.editing.set($(e.currentTarget).attr('name'))
		t.saveSetting()

	'click .cancel': (e, t) ->
		e.preventDefault()
		t.editing.set()

	'click .save': (e, t) ->
		e.preventDefault()
		t.saveSetting()

Template.channelSettings.onCreated ->
	@editing = new ReactiveVar

	@settings =
		name:
			type: 'text'
			label: 'Name'
			canView: (room) => room.t isnt 'd'
			canEdit: (room) => RocketChat.authz.hasAllPermission('edit-room', room._id)
			save: (value, room) ->
				if not RocketChat.authz.hasAllPermission('edit-room', room._id) or room.t not in ['c', 'p']
					return toastr.error t('error-not-allowed')

				try
					nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
				catch
					nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

				if not nameValidation.test value
					return toastr.error t('error-invalid-room-name', { room_name: name: value })

				RocketChat.callbacks.run 'roomNameChanged', { _id: room._id, name: value }
				Meteor.call 'saveRoomSettings', room._id, 'roomName', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'Room_name_changed_successfully'

		topic:
			type: 'markdown'
			label: 'Topic'
			canView: (room) => true
			canEdit: (room) => RocketChat.authz.hasAllPermission('edit-room', room._id)
			save: (value, room) ->
				Meteor.call 'saveRoomSettings', room._id, 'roomTopic', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'Room_topic_changed_successfully'
					RocketChat.callbacks.run 'roomTopicChanged', room

		description:
			type: 'text'
			label: 'Description'
			canView: (room) => room.t isnt 'd'
			canEdit: (room) => RocketChat.authz.hasAllPermission('edit-room', room._id)
			save: (value, room) ->
				Meteor.call 'saveRoomSettings', room._id, 'roomDescription', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'Room_description_changed_successfully'

		t:
			type: 'boolean'
			label: 'Private'
			isToggle: true
			processing: new ReactiveVar(false)
			canView: (room) ->
				if room.t not in ['c', 'p']
					return false
				else if room.t is 'p' and not RocketChat.authz.hasAllPermission('create-c')
					return false
				else if room.t is 'c' and not RocketChat.authz.hasAllPermission('create-p')
					return false
				return true
			canEdit: (room) => RocketChat.authz.hasAllPermission('edit-room', room._id)
			save: (value, room) ->
				@processing.set(true)
				value = if value then 'p' else 'c'
				RocketChat.callbacks.run 'roomTypeChanged', room
				Meteor.call 'saveRoomSettings', room._id, 'roomType', value, (err, result) =>
					return handleError err if err
					@processing.set(false)
					toastr.success TAPi18n.__ 'Room_type_changed_successfully'

		ro:
			type: 'boolean'
			label: 'Read_only'
			isToggle: true
			processing: new ReactiveVar(false)
			canView: (room) => room.t isnt 'd'
			canEdit: (room) => RocketChat.authz.hasAllPermission('set-readonly', room._id)
			save: (value, room) ->
				@processing.set(true)
				Meteor.call 'saveRoomSettings', room._id, 'readOnly', value, (err, result) =>
					return handleError err if err
					@processing.set(false)
					toastr.success TAPi18n.__ 'Read_only_changed_successfully'

		reactWhenReadOnly:
			type: 'boolean'
			label: 'React_when_read_only'
			canView: (room) => room.t isnt 'd' and room.ro
			canEdit: (room) => RocketChat.authz.hasAllPermission('set-react-when-readonly', room._id)
			save: (value, room) ->
				Meteor.call 'saveRoomSettings', room._id, 'reactWhenReadOnly', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'React_when_read_only_changed_successfully'

		archived:
			type: 'boolean'
			label: 'Room_archivation_state_true'
			isToggle: true,
			processing: new ReactiveVar(false)
			canView: (room) => room.t isnt 'd'
			canEdit: (room) => RocketChat.authz.hasAtLeastOnePermission(['archive-room', 'unarchive-room'], room._id)
			save: (value, room) =>
				swal {
					title: t('Are_you_sure')
					type: 'warning'
					showCancelButton: true
					confirmButtonColor: '#DD6B55'
					confirmButtonText: if value then t('Yes_archive_it') else t('Yes_unarchive_it')
					cancelButtonText: t('Cancel')
					closeOnConfirm: false
					html: false
				}, (confirmed) =>
					swal.disableButtons()
					if (confirmed)
						action = if value then 'archiveRoom' else 'unarchiveRoom'
						Meteor.call action, room._id, (err, results) =>
							if err
								swal.enableButtons()
								handleError err
							swal
								title: if value then t('Room_archived') else t('Room_has_been_archived')
								text: if value then t('Room_has_been_archived') else t('Room_has_been_unarchived')
								type: 'success'
								timer: 2000
								showConfirmButton: false
							RocketChat.callbacks.run action, room
					else
						$(".channel-settings form [name='archived']").prop('checked', room.archived)

		joinCode:
			type: 'text'
			label: 'Password'
			canView: (room) => room.t is 'c' and RocketChat.authz.hasAllPermission('edit-room', room._id)
			canEdit: (room) => RocketChat.authz.hasAllPermission('edit-room', room._id)
			save: (value, room) ->
				Meteor.call 'saveRoomSettings', room._id, 'joinCode', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'Room_password_changed_successfully'
					RocketChat.callbacks.run 'roomCodeChanged', room


	@saveSetting = =>
		room = ChatRoom.findOne @data?.rid
		field = @editing.get()

		if @settings[field].type is 'select'
			value = @$(".channel-settings form [name=#{field}]:checked").val()
		else if @settings[field].type is 'boolean'
			value = @$(".channel-settings form [name=#{field}]").is(":checked")
		else
			value = @$(".channel-settings form [name=#{field}]").val()

		if value isnt room[field]
			@settings[field].save(value, room)

		@editing.set()
