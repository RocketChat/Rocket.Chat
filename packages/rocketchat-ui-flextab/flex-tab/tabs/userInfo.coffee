Template.userInfo.helpers
	utc: ->
		if @utcOffset?
			if @utcOffset > 0
				return '+' + @utcOffset
			return @utcOffset

	phoneNumber: ->
		return '' unless @phoneNumber
		if @phoneNumber.length > 10
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,5)}-#{@phoneNumber.substr(7)}"
		else
			return "(#{@phoneNumber.substr(0,2)}) #{@phoneNumber.substr(2,4)}-#{@phoneNumber.substr(6)}"

	lastLogin: ->
		if @lastLogin
			return moment(@lastLogin).format('LLL')

	createdAt: ->
		if @createdAt
			return moment(@createdAt).format('LLL')

	canDirectMessage: (username) ->
		return Meteor.user()?.username isnt username

	linkedinUsername: ->
		return s.strRight @services.linkedin.publicProfileUrl, '/in/'

	servicesMeteor: ->
		return @services?['meteor-developer']

	userTime: ->
		if @utcOffset?
			return Template.instance().now.get().utcOffset(@utcOffset).format('LT')

	canRemoveUser: ->
		return RocketChat.authz.hasAllPermission('remove-user', Session.get('openedRoom'))

	canMuteUser: ->
		return RocketChat.authz.hasAllPermission('mute-user', Session.get('openedRoom'))

	userMuted: ->
		room = ChatRoom.findOne(Session.get('openedRoom'))
		if _.isArray(room?.muted) and room.muted.indexOf(Session.get('showUserInfo')) isnt -1
			return true
		return false

	canSetModerator: ->
		return RocketChat.authz.hasAllPermission('set-moderator', Session.get('openedRoom'))

	isModerator: ->
		return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": @user?._id, roles: 'moderator' })

	canSetOwner: ->
		return RocketChat.authz.hasAllPermission('set-owner', Session.get('openedRoom'))

	isOwner: ->
		return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": @user?._id, roles: 'owner' })

Template.userInfo.events
	'click .pvt-msg': (e) ->
		Meteor.call 'createDirectMessage', Session.get('showUserInfo'), (error, result) ->
			console.log result
			if error
				return toastr.error error.reason

			if result?.rid?
				FlowRouter.go('direct', { username: Session.get('showUserInfo') })

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

	'click .back': (e) ->
		Session.set('showUserInfo', null)

	'click .remove-user': (e) ->
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
				Meteor.call 'removeUserFromRoom', { rid: rid, username: @user.username }, (err, result) ->
					if err
						return toastr.error(err.reason or err.message)
					swal
						title: t('Removed')
						text: t('User_has_been_removed_from_s', room.name)
						type: 'success'
						timer: 2000
						showConfirmButton: false
					Session.set('showUserInfo', null)
		else
			toastr.error(TAPi18n.__ 'Not_allowed')

	'click .mute-user': (e) ->
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
				Meteor.call 'muteUserInRoom', { rid: rid, username: @user.username }, (err, result) ->
					if err
						return toastr.error(err.reason or err.message)
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
			Meteor.call 'unmuteUserInRoom', { rid: rid, username: @user.username }, (err, result) ->
				if err
					return toastr.error(err.reason or err.message)
				toastr.success TAPi18n.__ 'User_unmuted_in_room'
		else
			toastr.error(TAPi18n.__ 'Not_allowed')

	'click .set-moderator': (e, t) ->
		e.preventDefault()

		userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": @user._id, roles: 'moderator' }, { fields: { _id: 1 } })
		unless userModerator?
			Meteor.call 'addRoomModerator', Session.get('openedRoom'), @user._id, (err, results) =>
				if err
					return toastr.error(err.reason or err.message)

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__is_now_a_moderator_of__room_name_', { username: @user.username, room_name: room.name }

	'click .unset-moderator': (e, t) ->
		e.preventDefault()

		userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": @user._id, roles: 'moderator' }, { fields: { _id: 1 } })
		if userModerator?
			Meteor.call 'removeRoomModerator', Session.get('openedRoom'), @user._id, (err, results) =>
				if err
					return toastr.error(err.reason or err.message)

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__removed_from__room_name__moderators', { username: @user.username, room_name: room.name }

	'click .set-owner': (e, t) ->
		e.preventDefault()

		userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": @user._id, roles: 'owner' }, { fields: { _id: 1 } })
		unless userOwner?
			Meteor.call 'addRoomOwner', Session.get('openedRoom'), @user._id, (err, results) =>
				if err
					return toastr.error(err.reason or err.message)

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__is_now_a_owner_of__room_name_', { username: @user.username, room_name: room.name }

	'click .unset-owner': (e, t) ->
		e.preventDefault()

		userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), "u._id": @user._id, roles: 'owner' }, { fields: { _id: 1 } })
		if userOwner?
			Meteor.call 'removeRoomOwner', Session.get('openedRoom'), @user._id, (err, results) =>
				if err
					return toastr.error(TAPi18n.__(err.error))

				room = ChatRoom.findOne(Session.get('openedRoom'))
				toastr.success TAPi18n.__ 'User__username__removed_from__room_name__owners', { username: @user.username, room_name: room.name }

Template.userInfo.onCreated ->
	@now = new ReactiveVar moment()
	self = @
	Meteor.setInterval ->
		self.now.set moment()
	, 30000
