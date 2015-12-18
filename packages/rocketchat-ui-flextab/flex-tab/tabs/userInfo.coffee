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
			return Template.instance().now.get().utcOffset(@utcOffset).format('HH:mm')

	canRemoveUser: ->
		return RocketChat.authz.hasAllPermission('remove-user', Session.get('openedRoom'))

	canMuteUser: ->
		return RocketChat.authz.hasAllPermission('mute-user', Session.get('openedRoom'))

	userMuted: ->
		room = ChatRoom.findOne(Session.get('openedRoom'))
		if _.isArray(room?.muted) and room.muted.indexOf(Session.get('showUserInfo')) isnt -1
			return true
		return false

Template.userInfo.events
	'click .pvt-msg': (e) ->
		Meteor.call 'createDirectMessage', Session.get('showUserInfo'), (error, result) ->
			console.log result
			if error
				return Errors.throw error.reason

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

	'click .remove-user': (e, t) ->
		e.preventDefault()
		rid = Session.get('openedRoom')
		room = ChatRoom.findOne rid
		if RocketChat.authz.hasAllPermission('remove-user', rid)
			Meteor.call 'removeUserFromRoom', { rid: rid, username: @user.username }, (err, result) ->
				if err
					return toastr.error(err.reason or err.message)
				toastr.success TAPi18n.__ 'User_removed_from_room'
				Session.set('showUserInfo', null)
		else
			toastr.error(TAPi18n.__ 'Not_allowed')

	'click .mute-user': (e, t) ->
		e.preventDefault()
		rid = Session.get('openedRoom')
		room = ChatRoom.findOne rid
		if RocketChat.authz.hasAllPermission('mute-user', rid)
			Meteor.call 'muteUserInRoom', { rid: rid, username: @user.username }, (err, result) ->
				if err
					return toastr.error(err.reason or err.message)
				toastr.success TAPi18n.__ 'User_muted_in_room'
		else
			toastr.error(TAPi18n.__ 'Not_allowed')

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

Template.userInfo.onCreated ->
	@now = new ReactiveVar moment()
	self = @
	Meteor.setInterval ->
		self.now.set moment()
	, 30000
