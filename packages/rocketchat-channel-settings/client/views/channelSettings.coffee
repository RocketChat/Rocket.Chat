Template.channelSettings.helpers
	toArray: (obj) ->
		arr = []
		for key, value of obj
			if key != "url"
				arr.push
					$key: key
					$value: value
		return arr

	valueOf: (obj, key) ->
		return obj?[key]

	showSetting: (setting, room) ->
		if setting.showInDirect is false
			return room.t isnt 'd'
		return true

	settings: ->
		return Template.instance().settings

	getProjectInfo: ->
		project_info = ChatRoom.findOne(@rid).details;
		if project_info.location
			project_info.location = JSON.parse(project_info.location).place;
		return project_info
	getRoom: ->
		return ChatRoom.findOne(@rid)

	editing: (field) ->
		#return Template.instance().editing.get() is field
		return false

	channelSettings: ->
		return RocketChat.ChannelSettings.getOptions()

	unscape: (value) ->
		return s.unescapeHTML value

	canDeleteRoom: ->
		roomType = ChatRoom.findOne(@rid, { fields: { t: 1 }})?.t
		if roomType == "d"
			return false
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
		t.editing.set($(e.currentTarget).data('edit'))
		setTimeout (-> t.$('input.editing').focus().select()), 100

	'click .cancel': (e, t) ->
		e.preventDefault()
		t.editing.set()

	'click .save': (e, t) ->
		e.preventDefault()
		t.saveSetting()

	'click .edit': (e, t) ->
		e.preventDefault()
		room_info = ChatRoom.findOne(@rid)
		if room_info.t != "d"
			window.open ChatRoom.findOne(@rid).details.url
		else
			window.open 'https://how.ubegin.com/discover/people/'+this.userDetail

	'click #open_profile' : (e,t) ->
		e.preventDefault()
		room_info = ChatRoom.findOne(@rid)
		window.open 'https://how.ubegin.com/discover/project/'+room_info.name

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
			type: 'select'
			label: 'Type'
			options:
				c: 'Channel'
				p: 'Private_Group'
			canView: (room) => room.t in ['c', 'p']
			canEdit: (room) => RocketChat.authz.hasAllPermission('edit-room', room._id)
			save: (value, room) ->
				if value not in ['c', 'p']
					return toastr.error t('error-invalid-room-type', value)

				RocketChat.callbacks.run 'roomTypeChanged', room
				Meteor.call 'saveRoomSettings', room._id, 'roomType', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'Room_type_changed_successfully'

		ro:
			type: 'boolean'
			label: 'Read_only'
			canView: (room) => room.t isnt 'd'
			canEdit: (room) => RocketChat.authz.hasAllPermission('set-readonly', room._id)
			save: (value, room) ->
				Meteor.call 'saveRoomSettings', room._id, 'readOnly', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'Read_only_changed_successfully'

		archived:
			type: 'boolean'
			label: 'Room_archivation_state_true'
			canView: (room) => room.t isnt 'd'
			canEdit: (room) => RocketChat.authz.hasAtLeastOnePermission(['archive-room', 'unarchive-room'], room._id)
			save: (value, room) ->
				if value is true
					Meteor.call 'archiveRoom', room._id, (err, results) ->
						return handleError err if err
						toastr.success TAPi18n.__ 'Room_archived'
						RocketChat.callbacks.run 'archiveRoom', room
				else
					Meteor.call 'unarchiveRoom', room._id, (err, results) ->
						return handleError err if err
						toastr.success TAPi18n.__ 'Room_unarchived'
						RocketChat.callbacks.run 'unarchiveRoom', room

		joinCode:
			type: 'text'
			label: 'Code'
			canView: (room) => room.t is 'c' and RocketChat.authz.hasAllPermission('edit-room', room._id)
			canEdit: (room) => RocketChat.authz.hasAllPermission('edit-room', room._id)
			save: (value, room) ->
				Meteor.call 'saveRoomSettings', room._id, 'joinCode', value, (err, result) ->
					return handleError err if err
					toastr.success TAPi18n.__ 'Room_code_changed_successfully'
					RocketChat.callbacks.run 'roomCodeChanged', room


	@saveSetting = =>
		room = ChatRoom.findOne @data?.rid
		field = @editing.get()

		if @settings[field].type is 'select'
			value = @$(".channel-settings form [name=#{field}]:checked").val()
		else if @settings[field].type is 'boolean'
			value = @$(".channel-settings form [name=#{field}]:checked").val() is 'true'
		else
			value = @$(".channel-settings form [name=#{field}]").val()

		if value isnt room[field]
			@settings[field].save(value, room)

		@editing.set()
