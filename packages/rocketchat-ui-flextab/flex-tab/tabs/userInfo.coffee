Template.userInfo.helpers
	name: ->
		user = Template.instance().user.get()
		return if user.name then user.name else TAPi18n.__ 'Unnamed'

	username: ->
		user = Template.instance().user.get()
		return user.username

	email: ->
		user = Template.instance().user.get()
		return user.emails?[0]?.address

	utc: ->
		user = Template.instance().user.get()
		if user.utcOffset?
			if user.utcOffset > 0
				return '+' + user.utcOffset
			return user.utcOffset

	lastLogin: ->
		user = Template.instance().user.get()
		if user.lastLogin
			return moment(user.lastLogin).format('LLL')

	createdAt: ->
		user = Template.instance().user.get()
		if user.createdAt
			return moment(user.createdAt).format('LLL')

	canDirectMessage: (username) ->
		return Meteor.user()?.username isnt username

	linkedinUsername: ->
		user = Template.instance().user.get()
		return s.strRight user?.services?.linkedin?.publicProfileUrl, '/in/'

	servicesMeteor: ->
		user = Template.instance().user.get()
		return user.services?['meteor-developer']

	userTime: ->
		user = Template.instance().user.get()
		if user.utcOffset?
			return Template.instance().now.get().utcOffset(user.utcOffset).format('LT')

	canRemoveUser: ->
		return RocketChat.authz.hasAllPermission('remove-user', Session.get('openedRoom'))

	canMuteUser: ->
		return RocketChat.authz.hasAllPermission('mute-user', Session.get('openedRoom'))

	userMuted: ->
		room = ChatRoom.findOne(Session.get('openedRoom'))
		user = Template.instance().user.get()

		return _.isArray(room?.muted) and room.muted.indexOf(user?.username) isnt -1

	canSetModerator: ->
		return RocketChat.authz.hasAllPermission('set-moderator', Session.get('openedRoom'))

	isModerator: ->
		return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": Template.instance().user.get()?._id, roles: 'moderator' })

	canSetOwner: ->
		return RocketChat.authz.hasAllPermission('set-owner', Session.get('openedRoom'))

	isOwner: ->
		return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": Template.instance().user.get()?._id, roles: 'owner' })

	user: ->
		return Template.instance().user.get()

	hasEmails: ->
		return _.isArray(this.emails)

	hasPhone: ->
		return _.isArray(this.phone)

	isLoading: ->
		return Template.instance().loadingUserInfo.get()

	hasAdminRole: ->
		return RocketChat.authz.hasRole(Template.instance().user.get()?._id, 'admin')

	active: ->
		user = Template.instance().user.get()
		return user?.active

	editingUser: ->
		return Template.instance().editingUser.get()

	userToEdit: ->
		instance = Template.instance()
		return {
			user: instance.user.get()
			back: (username) ->
				instance.editingUser.set()

				if username?
					user = instance.user.get()
					if user?.username isnt username
						instance.loadedUsername.set username
		}

Template.userInfo.events
	'click .thumb': (e) ->
		$(e.currentTarget).toggleClass('bigger')

	'click .pvt-msg': (e) ->
		Meteor.call 'createDirectMessage', @username, (error, result) =>
			if error
				return handleError(error)

			if result?.rid?
				FlowRouter.go('direct', { username: @username })

	"click .flex-tab  .video-remote" : (e) ->
		if RocketChat.TabBar.isFlexOpen()
			if (!Session.get('rtcLayoutmode'))
				Session.set('rtcLayoutmode', 1)
			else
				t = Session.get('rtcLayoutmode')
				t = (t + 1) % 4
				console.log  'setting rtcLayoutmode to ' + t  if window.rocketDebug
				Session.set('rtcLayoutmode', t)

	"click .flex-tab  .video-self" : (e) ->
		if (Session.get('rtcLayoutmode') == 3)
			console.log 'video-self clicked in layout3' if window.rocketDebug
			i = document.getElementById("fullscreendiv")
			if i.requestFullscreen
				i.requestFullscreen()
			else
				if i.webkitRequestFullscreen
					i.webkitRequestFullscreen()
				else
					if i.mozRequestFullScreen
						i.mozRequestFullScreen()
					else
						if i.msRequestFullscreen
							i.msRequestFullscreen()

	'click .back': (e, instance) ->
		instance.clear()

	'click .remove-user': (e, instance) ->
		e.preventDefault()
		rid = Session.get('openedRoom')
		room = ChatRoom.findOne rid
		if RocketChat.authz.hasAllPermission('remove-user', rid)
			swal {
				title: t('Are_you_sure')
				text: t('The_user_will_be_removed_from_s', room.name)
				type: 'warning'
				showCancelButton: true
				confirmButtonColor: '#DD6B55'
				confirmButtonText: t('Yes_remove_user')
				cancelButtonText: t('Cancel')
				closeOnConfirm: false
				html: false
			}, =>
				Meteor.call 'removeUserFromRoom', { rid: rid, username: instance.user.get()?.username }, (err, result) =>
					if err
						return handleError(err)
					swal
						title: t('Removed')
						text: t('User_has_been_removed_from_s', room.name)
						type: 'success'
						timer: 2000
						showConfirmButton: false

					instance.clear()
		else
			toastr.error(TAPi18n.__ 'error-not-allowed')

	'click .mute-user': (e, instance) ->
		e.preventDefault()
		rid = Session.get('openedRoom')
		room = ChatRoom.findOne rid
		if RocketChat.authz.hasAllPermission('mute-user', rid)
			swal {
				title: t('Are_you_sure')
				text: t('The_user_wont_be_able_to_type_in_s', room.name)
				type: 'warning'
				showCancelButton: true
				confirmButtonColor: '#DD6B55'
				confirmButtonText: t('Yes_mute_user')
				cancelButtonText: t('Cancel')
				closeOnConfirm: false
				html: false
			}, =>
				Meteor.call 'muteUserInRoom', { rid: rid, username: instance.user.get()?.username }, (err, result) ->
					if err
						return handleError(err)
					swal
						title: t('Muted')
						text: t('User_has_been_muted_in_s', room.name)
						type: 'success'
						timer: 2000
						showConfirmButton: false

	'click .unmute-user': (e, t) ->
		e.preventDefault()
		rid = Session.get('openedRoom')
		room = ChatRoom.findOne rid
		if RocketChat.authz.hasAllPermission('mute-user', rid)
			Meteor.call 'unmuteUserInRoom', { rid: rid, username: t.user.get()?.username }, (err, result) ->
				if err
					return handleError(err)
				toastr.success TAPi18n.__ 'User_unmuted_in_room'
		else
			toastr.error(TAPi18n.__ 'error-not-allowed')

	'click .set-moderator': (e, t) ->
		e.preventDefault()

		userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": t.user.get()?._id, roles: 'moderator' }, { fields: { _id: 1 } })
		unless userModerator?
			Meteor.call 'addRoomModerator', Session.get('openedRoom'), t.user.get()?._id, (err, results) =>
				if err
					return handleError(err)

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__is_now_a_moderator_of__room_name_', { username: @username, room_name: room.name }

	'click .unset-moderator': (e, t) ->
		e.preventDefault()

		userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": t.user.get()?._id, roles: 'moderator' }, { fields: { _id: 1 } })
		if userModerator?
			Meteor.call 'removeRoomModerator', Session.get('openedRoom'), t.user.get()?._id, (err, results) =>
				if err
					return handleError(err)

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__removed_from__room_name__moderators', { username: @username, room_name: room.name }

	'click .set-owner': (e, t) ->
		e.preventDefault()

		userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": t.user.get()?._id, roles: 'owner' }, { fields: { _id: 1 } })
		unless userOwner?
			Meteor.call 'addRoomOwner', Session.get('openedRoom'), t.user.get()?._id, (err, results) =>
				if err
					return handleError(err)

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__is_now_a_owner_of__room_name_', { username: @username, room_name: room.name }

	'click .unset-owner': (e, t) ->
		e.preventDefault()

		userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": t.user.get()?._id, roles: 'owner' }, { fields: { _id: 1 } })
		if userOwner?
			Meteor.call 'removeRoomOwner', Session.get('openedRoom'), t.user.get()?._id, (err, results) =>
				if err
					return handleError(err)

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__removed_from__room_name__owners', { username: @username, room_name: room.name }

	'click .deactivate': (e, instance) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setUserActiveStatus', instance.user.get()?._id, false, (error, result) ->
			if result
				toastr.success t('User_has_been_deactivated')
			if error
				handleError(error)

	'click .activate': (e, instance) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setUserActiveStatus', instance.user.get()?._id, true, (error, result) ->
			if result
				toastr.success t('User_has_been_activated')
			if error
				handleError(error)

	'click .make-admin': (e, instance) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setAdminStatus', instance.user.get()?._id, true, (error, result) ->
			if result
				toastr.success t('User_is_now_an_admin')
			if error
				handleError(error)

	'click .remove-admin': (e, instance) ->
		e.stopPropagation()
		e.preventDefault()
		Meteor.call 'setAdminStatus', instance.user.get()?._id, false, (error, result) ->
			if result
				toastr.success t('User_is_no_longer_an_admin')
			if error
				handleError(error)

	'click .delete': (e, instance) ->
		e.stopPropagation()
		e.preventDefault()
		_id = instance.user.get()?._id
		swal {
			title: t('Are_you_sure')
			text: t('Delete_User_Warning')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_delete_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		}, ->
			swal.disableButtons()

			Meteor.call 'deleteUser', _id, (error, result) ->
				if error
					handleError(error)
					swal.enableButtons()
				else
					swal
						title: t('Deleted')
						text: t('User_has_been_deleted')
						type: 'success'
						timer: 2000
						showConfirmButton: false

					RocketChat.TabBar.closeFlex()

	'click .edit-user': (e, instance) ->
		e.stopPropagation()
		e.preventDefault()

		instance.editingUser.set instance.user.get()._id

Template.userInfo.onCreated ->
	@now = new ReactiveVar moment()

	@user = new ReactiveVar

	@editingUser = new ReactiveVar

	@loadingUserInfo = new ReactiveVar true

	@loadedUsername = new ReactiveVar

	Meteor.setInterval =>
		@now.set moment()
	, 30000

	@autorun =>
		username = @loadedUsername.get()

		if not username?
			@loadingUserInfo.set false
			return

		@loadingUserInfo.set true

		@subscribe 'fullUserData', username, 1, =>
			@loadingUserInfo.set false

	@autorun =>
		data = Template.currentData()
		if data.clear?
			@clear = data.clear

	@autorun =>
		data = Template.currentData()
		user = @user.get()
		@loadedUsername.set user?.username or data?.username

	@autorun =>
		data = Template.currentData()
		if data.username?
			filter = { username: data.username }
		else if data._id?
			filter = { _id: data._id }

		user = Meteor.users.findOne(filter)

		@user.set user

