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

	videoActive: ->
		return (Session.get('remoteVideoUrl') || Session.get('selfVideoUrl'))

	rtcLayout1: ->
		return (Session.get('rtcLayoutmode') == 1 ? true: false)

	rtcLayout2: ->
		return (Session.get('rtcLayoutmode') == 2 ? true: false)

	rtcLayout3: ->
		return (Session.get('rtcLayoutmode') == 3 ? true: false)

	noRtcLayout: ->
		return (!Session.get('rtcLayoutmode') || (Session.get('rtcLayoutmode') == 0) ? true: false)

	remoteVideoUrl: ->
		return Session.get('remoteVideoUrl')

	selfVideoUrl: ->
		return Session.get('selfVideoUrl')

	userTime: ->
		if @utcOffset?
			return Template.instance().now.get().utcOffset(@utcOffset).format('HH:mm')

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

	'click .start-video': (event) ->
		_id = Session.get('openedRoom')
		webrtc.to = _id.replace(Meteor.userId(), '')
		webrtc.room = _id
		webrtc.mode = 1
		webrtc.start(true)

	'click .stop-video': (event) ->
		webrtc.stop()

	'click .monitor-video': (event) ->
		_id = Session.get('openedRoom')
		webrtc.to = _id.replace(Meteor.userId(), '')
		webrtc.room = _id
		webrtc.mode = 2
		webrtc.start(true)

	'click .setup-video': (event) ->
		webrtc.mode = 2
		webrtc.activateLocalStream()


Template.userInfo.onCreated ->
	@now = new ReactiveVar moment()
	self = @
	Meteor.setInterval ->
		self.now.set moment()
	, 30000
