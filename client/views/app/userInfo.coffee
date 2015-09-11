Template.userInfo.helpers
	isAdmin: ->
		return Meteor.user()?.admin is true
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

	canDirectMessage: ->
		return Meteor.user()?.username isnt this.username

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

Template.userInfo.onCreated ->
	@now = new ReactiveVar moment()
	self = @
	Meteor.setInterval ->
		self.now.set moment()
	, 30000