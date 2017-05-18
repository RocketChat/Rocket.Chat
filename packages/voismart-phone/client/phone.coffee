import moment from 'moment'
import toastr from 'toastr'

Meteor.startup ->

	if Meteor.isCordova
		return


	RocketChat.ToneGenerator = new PhoneTones(0, 0)

	Tracker.autorun ->
		user  = Meteor.user()
		if not user
			return

		enabled = RocketChat.settings.get('Phone_Enabled')
		wss = RocketChat.settings.get('Phone_WSS')
		servers = RocketChat.settings.get("Phone_ICEServers")
		forceRelay = RocketChat.settings.get("Phone_ICEForceRelay")

		iceServers = []
		if servers? and (servers?.trim() isnt '')
			servers = servers.replace /\s/g, ''
			servers = servers.split ','
			for server in servers
				server = server.split '@'
				serverConfig =
					urls: [server.pop()]

				if server.length is 1
					server = server[0].split ':'
					serverConfig.username = decodeURIComponent(server[0])
					serverConfig.credential = decodeURIComponent(server[1])

				iceServers.push serverConfig
		iceConfig = {forceRelay: forceRelay, iceServers: iceServers}

		if not enabled or not wss
			console.log("Phone not enabled or missing server url") if window.rocketDebug
			return

		plogin = user.phonelogin
		ppass = user.phonepassword

		if not plogin or not ppass
			console.warn("Phone account data not set (yet?)")
			return

		RocketChat.Phone.start(plogin, ppass, wss, iceConfig)


Template.phone.events
	'click #phone_settings': (e, instance) ->
		showSettings = instance.showSettings.get()
		instance.showSettings.set(!showSettings)

	'mousedown .button.dialkey': (e, instance) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.startDtmf(value)

	'mouseup .button.dialkey': (e, instance) ->
		value = _.trim $(e.target).val()
		display = instance.phoneDisplay.get()
		instance.phoneDisplay.set(display + value)
		instance.search(display + value)
		RocketChat.Phone.endDtmf(value)

	'paste #phone-display':  _.debounce (e, instance) ->
		value = $(e.target).val()
		replaced_value = value.replace(/\D/g,'')
		if !replaced_value
			replaced_value = ""
		RocketChat.Phone.setSearchTerm(replaced_value)
		RocketChat.Phone.setSearchResult(replaced_value)
		instance.phoneDisplay.set(replaced_value)
		$('#phone-display').val(replaced_value)
	, 200

	'change #phone-display': (e, instance) ->
		value = _.trim $(e.target).val()
		instance.phoneDisplay.set(value)

	'keydown #phone-display': _.debounce (e, instance) ->
		if e.keyCode == 13
			number = instance.phoneDisplay.get()
			RocketChat.Phone.newCall(number)

		else
			value = e.target.value.trim()
			if value is '' and RocketChat.Phone.getSearchTerm()
					RocketChat.Phone.setSearchTerm('')
					RocketChat.Phone.setSearchResult(undefined)
					return
			else if value is RocketChat.Phone.getSearchTerm()
					return
			instance.search()
	, 500

	'click #phone-dial': (e, instance)->
		number = instance.phoneDisplay.get()
		RocketChat.Phone.dialKey(number)
		instance.phoneDisplay.set('')

	'click #phone-video-dial': (e, instance)->
		number = instance.phoneDisplay.get()
		RocketChat.Phone.dialKey(number, true)
		instance.phoneDisplay.set('')

	'click #phone-hangup': (e, instance)->
		if window.rocketDebug
			console.log "hangup"

		RocketChat.Phone.hangup()
		instance.phoneDisplay.set('')

	'click #phone-hold': (e, instance)->
		if window.rocketDebug
			console.log "toggle hold"
		RocketChat.Phone.toggleHold()

	'click #phone-mute': (e, instance)->
		if window.rocketDebug
			console.log "toggle mute"
		RocketChat.Phone.toggleMute()

	'click #phone-redial': (e, instance)->
		if window.rocketDebug
			console.log "redialing...."

		lastCalled = RocketChat.Phone.getLastCalled()
		if lastCalled
			instance.phoneDisplay.set(lastCalled)
			RocketChat.Phone.redial()

	'click #phone-clear': (e, instance)->
		if window.rocketDebug
			console.log "clearing display"

		instance.phoneDisplay.set('')
		RocketChat.Phone.setSearchTerm('')
		RocketChat.Phone.setSearchResult()

	'click #phone-transfer': (e, instance)->
		if window.rocketDebug
			console.log "transferring call..."

		number = instance.phoneDisplay.get()
		if number
			RocketChat.Phone.transfer(number)
		else
			toastr.error TAPi18n.__('Empty_Number')

	'click #phone-fullscreen': (e, instance) ->
		i = document.getElementById("phonestream")
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

	'click .phone-search-contact-number': (e, instance) ->
		number = _.trim $(e.target).text()
		instance.phoneDisplay.set(number)
		RocketChat.Phone.newCall(number)

	'click .phone-registry-record-number': (e, instance) ->
		number = _.trim $(e.target).text()
		instance.phoneDisplay.set(number)
		RocketChat.Phone.newCall(number)

	'click #phone_personal_registry': (e, instance) ->
		showRegistry = instance.showRegistry.get()
		if !showRegistry
			Meteor.call 'getPersonalRegistry', (error, results) =>
				if not results?
					instance.listRegistry.set([])
				else
					repr_res = []
					for record in results.calls
						convert_date = moment(record.start_time).format("DD-MM-YYYY H:mm:ss")
						convert_status = "icon-up"
						switch record.status
							when "out"
								convert_status = "icon-up"
							when "in"
								convert_status = "icon-down"
							when "missed"
								convert_status = "icon-forward"
						repr_res.push({'number': record.number, 'status': convert_status, 'start_time': convert_date, 'name': record.name})
					instance.listRegistry.set({'calls': repr_res})
		else
			instance.listRegistry.set([])

		instance.showRegistry.set(!showRegistry)

Template.phone.helpers
	phoneDisplay: ->
		return Template.instance().phoneDisplay.get()

	showSettings: ->
		return Template.instance().showSettings.get()

	callIsActive: ->
		if RocketChat.Phone.getCallState() == 'active'
			return true

	callIsRinging: ->
		if RocketChat.Phone.getCallState() == 'ringing'
			return true

	callIsIdle: ->
		if RocketChat.Phone.getCallState()
			return false
		return true

	callState: ->
		return RocketChat.Phone.getCallState()

	callCidNameOrNum: ->
		cidname = RocketChat.Phone.getCallCidName()
		if cidname.trim() == ""
			return RocketChat.Phone.getCallCidNum()
		else
			return cidname

	callCidName: ->
		return RocketChat.Phone.getCallCidName()

	callCidNum: ->
		return RocketChat.Phone.getCallCidNum()

	callOperation: ->
		return RocketChat.Phone.getCallOperation()

	displayCallStatus: ->
		if RocketChat.Phone.getCallState() and (RocketChat.Phone.getCallCidName() or RocketChat.Phone.getCallCidNum())
			return true
		return false

	onHold: ->
		if RocketChat.Phone.isOnHold()
			return 'phone-active-key'
		return ''

	isMuted: ->
		if RocketChat.Phone.isMuted()
			return 'phone-active-key'
		return ''

	searchTerm: ->
    	return RocketChat.Phone.getSearchTerm()

	searchResult: ->
		return RocketChat.Phone.getSearchResult()

	showRegistry: ->
		return Template.instance().showRegistry.get()

	listRegistry: ->
		return Template.instance().listRegistry.get()

	videoEnabled: ->
		return RocketChat.Phone.getEnabledCamera()

	callIsAnswered: ->
		return RocketChat.Phone.isAnswered()

	callDuration: ->
		start = localStorage.getItem("VoiSmart::Phone::lastAnswered")
		if start
			now = Math.round(Chronos.now() / 1000)
		else
			start = now
		return moment().startOf('day').seconds(now - start).format('HH:mm:ss')

Template.phone.onCreated ->
	@showSettings = new ReactiveVar false
	@phoneDisplay = new ReactiveVar ""
	@showRegistry = new ReactiveVar false
	@listRegistry = new ReactiveVar ""


Template.phone.onDestroyed ->
	if window.rocketDebug
		console.log("Moving video tag out from containter")

	RocketChat.Phone.removeVideo()


Template.phone.onRendered ->
	@autorun ->
		if window.rocketDebug
			console.log("Moving video tag to its containter")
		Session.get('openedRoom')
		FlowRouter.watchPathChange()
		RocketChat.Phone.placeVideo()

	@search = (searchvalue) =>
		if searchvalue
			current_search = searchvalue
		else
			current_search = @$('#phone-display').val()

		RocketChat.Phone.setSearchTerm(current_search)
		Meteor.call 'getContacts', current_search, (error, results) =>
			if not results?
				RocketChat.Phone.setSearchResult([])
			else
			    RocketChat.Phone.setSearchResult(results)


RocketChat.Phone = new class
	callState = new ReactiveVar null
	callCidName = new ReactiveVar ""
	callCidNum = new ReactiveVar ""
	callOperation = new ReactiveVar ""
	onHold = new ReactiveVar false
	muted = new ReactiveVar false
	searchTerm = new ReactiveVar ''
	searchResult = new ReactiveVar
	enabledCamera = new ReactiveVar false
	answered = new ReactiveVar false

	_started = false
	_login = undefined
	_password = undefined
	_vertoHandle = undefined
	_server = undefined
	_iceConfig = {forceRelay: false, iceServers: []}
	_videoTag = undefined
	_vertoEchoTimer = undefined

	_audioInDevice = undefined
	_audioOutDevice = undefined
	_videoDevice = null
	_useDeskPhone = false

	_curCall = null
	_dialogs = {}
	_callState = null
	_isVideoCall = false

	_curResolutions = null
	_curVideoW = null
	_curVideoH = null

	_tabBars = []

	constructor: ->
		if window.rocketDebug
			console.log("Starting a new Phone Handler")
		WebNotifications.registerCallbacks('phone', [
			{name: 'answer', callback: => answer(false)},
			{name: 'hangup', callback: => @hangup()}
		])

	answer = (useVideo) ->
		if window.rocketDebug
			console.log "Will answer call"

		if useVideo
			useVideo = true
			_videoTag.css('display', 'block')
		else
			useVideo = false
			_videoTag.css('display', 'none')

		_isVideoCall = useVideo

		has_video = false
		if _videoDevice and (_videoDevice != "none") and useVideo
			has_video = true

		_curCall?.answer({
			useVideo: has_video,
			useStereo: true,
			useCamera: _videoDevice,
			useSpeak: _audioOutDevice || "none",
			useMic: _audioInDevice || "none",
		}, {})

	onWSLogin = (verto, success) ->
		if window.rocketDebug
			console.log('onWSLogin', success)

		if _vertoEchoTimer?
			Meteor.clearInterval(_vertoEchoTimer)
			_vertoEchoTimer = undefined
		_vertoEchoTimer = Meteor.setInterval(vertoPinger, 15000)

	vertoPinger = () ->
		if _vertoHandle?
			_vertoHandle.sendMethod("echo", {alive: true})

	onWSClose = (verto, success) ->
		if _vertoEchoTimer?
			Meteor.clearInterval(_vertoEchoTimer)
			_vertoEchoTimer = undefined

		if window.rocketDebug
			console.log('onWSClose', success)

	setCallState = (state) ->
		_callState = state
		callState.set(state)

	onDialogState = (d) ->
		if window.rocketDebug
			console.log('on rocket dialog ', d)
			console.log('current dialogs ', _dialogs)

		_dialogs[d.callID] = d

		if !_curCall?
			_curCall = d

		if d.callID != _curCall.callID
			switch d.state.name
				when 'ringing'
					RocketChat.ToneGenerator.stop()
					console.log("refusing call")
					d.stopRinging()
					d.hangup({cause: "USER_BUSY", causeCode: 17})
				when 'hangup', 'destroy'
					RocketChat.ToneGenerator.stop()
					delete _dialogs[d.callID]
					WebNotifications.closeNotification 'phone'
			return

		if window.rocketDebug
			console.log "Processing state RQ:" + d.state.name

		switch d.state.name
			when 'trying'
				setCallState('active')
				RocketChat.TabBar.updateButton('phone', { class: 'phone-blinking' })
				RocketChat.ToneGenerator.startRingback()

			when 'early'
				setCallState('active')
				RocketChat.TabBar.updateButton('phone', { class: 'phone-blinking' })
				RocketChat.ToneGenerator.stop()

			when 'ringing'
				setCallState('ringing')
				RocketChat.TabBar.updateButton('phone', { class: 'phone-blinking' })
				Meteor.call 'phoneFindUserByQ', {phoneextension: d.params.caller_id_number}, (error, user) =>
					if error or !user
						username = d.params.caller_id_name
					else
						username = user.username

					openTabBar()

					msg = TAPi18n.__("Incoming_call_from")
					putNotification(msg, d.params.caller_id_number, d.params.caller_id_name)
					cid = d.params.caller_id_number + ' ' + d.params.caller_id_name
					title = TAPi18n.__ "Phone_Call"
					text = TAPi18n.__("Incoming_call_from") + '\n' + cid
					actions = [
						{action: 'answer', title: TAPi18n.__('Phone_Answer'), icon: 'images/answer.png'},
						{action: 'hangup', title: TAPi18n.__('Phone_Hangup'), icon: 'images/hangup.png'}
					]
					notification =
						title: title
						text: text
						actions: actions
						prefix: 'phone'
						icon: 'images/call.png'
						requireInteraction: true
						payload:
							rid: Session.get('openedRoom')
							sender:
								name: d.params.caller_id_name
								username: username

					WebNotifications.showNotification notification

			when 'active'
				setCallState('active')
				RocketChat.ToneGenerator.stop()
				msg = TAPi18n.__("In_call_with")
				if !d.attach
					now = new Date().getTime()
					localStorage.setItem("VoiSmart::Phone::lastAnswered", Math.round(now / 1000))
				answered.set(true)
				if d.direction.name == 'outbound'
					putNotification(msg, d.params.destination_number)
				else
				    d.stopRinging()
					putNotification(msg, d.params.caller_id_number, d.params.caller_id_name)
				WebNotifications.closeNotification 'phone'
				RocketChat.TabBar.updateButton('phone', { class: 'red' })

			when 'hangup'
				RocketChat.ToneGenerator.stop()
				answered.set(false)
				localStorage.removeItem("VoiSmart::Phone::lastAnswered")
				localStorage.removeItem("VoiSmart::Phone::sessionUUID")
				if _callState != 'transfer'
					if window.rocketDebug
						console.log("hangup call rq")
					_curCall.hangup()

				setCallState('hangup')
				_curCall = null
				clearNotification()
				RocketChat.TabBar.updateButton('phone', { class: '' })
				if d.answered or d.gotAnswer or d.cause == 'ORIGINATOR_CANCEL' or d.cause == 'NORMAL CLEARING'
					toastr.success TAPi18n.__('Phone_end_call')
				else
					msg = TAPi18n.__('Phone_failed_call')
					toastr.error(msg + ": " + RocketChat.Phone.remap_hcause(d.cause))
				WebNotifications.closeNotification 'phone'

			when 'destroy'
				RocketChat.ToneGenerator.stop()
				if _callState != 'transfer' and _callState != 'hangup'
					if window.rocketDebug
						console.log("destroy call rq")
					_curCall.hangup()

				setCallState(null)
				_curCall = null
				clearNotification()
				delete _dialogs[d.callID]
				WebNotifications.closeNotification 'phone'
				$("#phonestream").css('display', 'none')
				Meteor.setTimeout ->
					closeTabBar()
				, 1000

	closeTabBar = () ->
		for tabBar in _tabBars
			if tabBar? and tabBar.getTemplate() == "phone"
				tabBar.close()

	openTabBar = () ->
		for tabBar in _tabBars
			if tabBar?
				tabBar.setTemplate "phone"
				tabBar.open()

	remap_hcause: (cause) ->
		dflt = cause
		mapper =
			'NORMAL CLEARING': 'Phone_end_call'
			'ORIGINATOR_CANCEL': 'Phone_end_call'
			'USER_BUSY': 'User_busy'
			'NO_ANSWER': 'No_answer'
			'NO_ROUTE_DESTINATION': 'No_route_destination'
			'DESTINATION_OUT_OF_ORDER': 'Destination_out_of_order'
			'NORMAL_TEMPORARY_FAILURE': 'Normal_temporary_failure'
			'PICKED_OFF': 'Picked_off'
			'LOSE_RACE': 'Lose_race'
		msg = mapper[cause]
		return TAPi18n.__(msg or dflt)

	clearNotification = ->
		callCidName.set('')
		callCidNum.set('')
		callOperation.set('')
		onHold.set(false)
		muted.set(false)

	putNotification = (msg, cidnum, cidname="") ->
		callCidNum.set(cidnum)
		callOperation.set(msg)
		Meteor.call 'phoneFindUserByQ', {phoneextension: cidnum}, (error, user) =>
			if error or !user
				callCidName.set(cidname)
			else
				callCidName.set(user.username)

	refreshVideoResolution = (resolutions) ->
		_curResolutions = resolutions.validRes
		if window.rocketDebug
			console.log ">>>>>>>>>< RESOLUTIONS >>>>>>>>>>>>>>>>>>"
			console.log resolutions
			console.log ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"

	bootstrap = (status) =>
		if window.rocketDebug
			console.log _started
			console.log _vertoHandle
			console.log _login
			console.log _password
			console.log _server
			console.log _iceConfig

		old_session_uuid = localStorage.getItem("VoiSmart::Phone::sessionUUID")
		if old_session_uuid
			session_uuid = old_session_uuid
		else
			session_uuid = $.verto.genUUID()
		localStorage.setItem("VoiSmart::Phone::sessionUUID", session_uuid)
		_vertoHandle = new jQuery.verto({
			login: _login,
			passwd: _password
			socketUrl: _server,
			ringFile: 'sounds/bell_ring2.wav',
			iceServers: _iceConfig?.iceServers,
			forceRelay: _iceConfig?.forceRelay,
			tagRinger: "phoneringer",
			tag: "phonestream"
			audioParams: {
				googEchoCancellation: true,
				googNoiseSuppression: true,
				googHighpassFilter: true
			},
			sessid: session_uuid,
			deviceParams: {
				useCamera: _videoDevice,
				onResCheck: refreshVideoResolution,
				useSpeak: _audioOutDevice,
				useMic: _audioInDevice
			}
		}, {
			onWSLogin: onWSLogin,
			onWSClose: onWSClose,
			onDialogState: onDialogState
		})
		_started = true

	setConfig = ->
		$.verto.refreshDevices(refreshDevices)
		conf = {
			audioInDevice: _audioInDevice
			audioOutDevice: _audioOutDevice
			videoDevice: _videoDevice
			useDeskPhone: _useDeskPhone
		}
		localStorage.setItem('MeteorPhoneConfig', $.toJSON(conf))

	getConfig = ->
		cached = localStorage.getItem('MeteorPhoneConfig')
		conf = $.parseJSON(cached)
		if not conf
			setConfig()
			return

		_audioInDevice = conf.audioInDevice
		_audioOutDevice = conf.audioOutDevice
		_videoDevice = conf.videoDevice
		_useDeskPhone = conf.useDeskPhone
		enabledCamera.set(conf.videoDevice)

	refreshDevices = (what) ->
		if window.rocketDebug
			console.log ">>>>>>>>>> REFRESH DEVICES <<<<<<<<<<<<"
			console.log what
			console.log ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"

		if _videoDevice
			$.FSRTC.getValidRes(_videoDevice, refreshVideoResolution)

	getCallState: ->
		return callState.get()

	getCallOperation: ->
		return callOperation.get()

	getCallCidName: ->
		return callCidName.get()

	getCallCidNum: ->
		return callCidNum.get()

	getSearchTerm: ->
		return searchTerm.get()

	getSearchResult: ->
		return searchResult.get()?.contacts

	setSearchTerm: (term) ->
		searchTerm.set(term)

	setSearchResult: (results) ->
		searchResult.set(results)

	getEnabledCamera: ->
		return enabledCamera.get()

	removeVideo: ->
		_videoTag = $("#phonestream")
		_videoTag.appendTo($("body"))
		_videoTag.css('display', 'none')
		if _curCall and _callState is 'active'
			_videoTag[0].play()

	placeVideo: ->
		_videoTag.appendTo($("#phone-video"))
		if _curCall and _callState is 'active' and _isVideoCall
			_videoTag.css('display', 'block')
			_videoTag[0].play()
		else if _curCall and _callState is 'active' and !_isVideoCall
			_videoTag.css('display', 'none')
			_videoTag[0].play()
		else
			_videoTag.css('display', 'none')

	transfer: (number) ->
		if _curCall and _callState is 'active'
			setCallState('transfer')
			_curCall.transfer(number)

	getLastCalled: ->
		return Session.get("VoiSmart::Phone::lastCalled")

	redial: () ->
		if !_curCall? and _callState is null
			@newCall(Session.get("VoiSmart::Phone::lastCalled"),
				Session.get("VoiSmart::Phone::lastUseVideo"))

	toggleMute: () ->
		if !_curCall?
			return

		muted.set(!muted.get())
		_curCall.setMute('toggle')
		return muted.get()

	isMuted: () ->
		return muted.get()

	isAnswered: () ->
		return answered.get()

	toggleHold: () ->
		if !_curCall?
			return

		onHold.set(!onHold.get())
		_curCall.toggleHold()
		return onHold.get()

	isOnHold: () ->
		return onHold.get()

	startDtmf: (key) ->
		RocketChat.ToneGenerator.startDtmf(key)

	endDtmf: (key) ->
		RocketChat.ToneGenerator.stop()
		if !_curCall?
			return

		_curCall.dtmf(key)

	hangup: ->
		if !_curCall?
			if window.rocketDebug
				console.log "No call to hangup"
			return

		_curCall.hangup()
		_curCall = null

	dialKey: (number, useVideo) ->

		if !_curCall? and _callState is null
			if !number
				toastr.error TAPi18n.__('Empty_Number')
				return
			@newCall(number, useVideo)
			return

		if _callState is 'ringing'
			answer(useVideo)
			return

		console.log('What Im doing here: ', _callState, ' ', _curCall)

	newCall: (destination, useVideo) ->
		@setSearchTerm('')
		@setSearchResult(undefined)
		if useVideo
			useVideo = true
			_videoTag.css('display', 'block')
		else
			useVideo = false
			_videoTag.css('display', 'none')

		_isVideoCall = useVideo
		Session.set("VoiSmart::Phone::lastUseVideo", useVideo)


		if !destination or destination is ''
			console.log("No number provided") if window.rocketDebug
			return

		if _curCall?
			console.log("Cannot call while in call") if window.rocketDebug
			return

		if _useDeskPhone and !useVideo
			Meteor.call 'clickAndDial', destination, (error, results) =>
				if error
					console.error("Error in calling click and dial method", error)
					toastr.error error.reason
			return

		has_mic = RocketChat.Phone.getAudioInDevice()
		has_speak = RocketChat.Phone.getAudioOutDevice()
		if !has_mic? or !has_speak? or has_mic is "none" or has_speak is "none"
			console.log("no mic and speaker defined, should refuse call?") if window.rocketDebug
			#return # firefox still has issues in device selection

		if !has_mic? or has_mic is "none"
			# all browsers have a mic, so bail out if none
			toastr.error TAPi18n.__('Phone_invalid_devices')
			settings_button = $('#phone_settings')
			if settings_button
				settings_button.addClass('phone-settings-blinking')
				Meteor.setTimeout ->
					if settings_button.hasClass('phone-settings-blinking')
						settings_button.removeClass('phone-settings-blinking')
				, 10000
			return

		has_video = false
		if _videoDevice and (_videoDevice != "none") and useVideo
			has_video = true

		setCallState('trying')
		_curCall = _vertoHandle.newCall({
			destination_number: destination,
			caller_id_name: Meteor.user().name,
			caller_id_number: Meteor.user().phoneextension,
			useVideo: has_video,
			useStereo: true,
			useCamera: _videoDevice,
			useSpeak: _audioOutDevice || "any",
			useMic: _audioInDevice || "any"
		}, {
			onDialogState: onDialogState
		})
		Session.set("VoiSmart::Phone::lastCalled", destination)
		msg = TAPi18n.__("Outgoing_call_to")
		putNotification(msg, destination)

	setVideoResolution: (idx) ->
		if idx is "0"
			_curVideoW = null
			_curVideoH = null
			delete _vertoHandle.videoParams.minWidth
			delete _vertoHandle.videoParams.maxWidth
			delete _vertoHandle.videoParams.minHeight
			delete _vertoHandle.videoParams.maxHeight
		else
			idx = idx - 1
			wxh = _curResolutions[idx]
			console.log(wxh) if window.rocketDebug
			_curVideoW = wxh[0]
			_curVideoH = wxh[1]
			_vertoHandle.videoParams({
				#width: _curVideoW,
				#height: _curVideoH
				minWidth: _curVideoW,
				minHeight: _curVideoH,
				maxWidth: _curVideoW,
				maxHeight: _curVideoH
			})

		_vertoHandle.videoParams({
			minFrameRate: 5,
			vertoBestFrameRate: 30
		})

	getResolutions: ->
		return _curResolutions

	setAudioInDevice: (id) ->
		_audioInDevice = id
		setConfig()

	getAudioInDevice: ->
		return _audioInDevice

	setAudioOutDevice: (id) ->
		_audioOutDevice = id
		setConfig()

	getAudioOutDevice: ->
		return _audioOutDevice

	getUseDeskPhone: ->
		return _useDeskPhone

	setUseDeskPhone: (value) ->
		value = parseInt(value)
		if value
			_useDeskPhone = true
		else
			_useDeskPhone = false
		setConfig()

	setVideoDevice: (id) ->
		if id is 'none'
			id = null
		_videoDevice = id
		enabledCamera.set(id)
		setConfig()

	getVideoDevice: ->
		return _videoDevice

	start: (login, password, server, iceConfig) ->
		console.log("Starting verto....") if window.rocketDebug

		if _started and (login != _login or _password != password or _server != server)
			_vertoHandle.logout()
			_vertoHandle = undefined
			_started = false
			console.log("Restarting an already started client") if window.rocketDebug

		if !_started
			console.log("Activating video element") if window.rocketDebug
			Blaze.render(Template.phonevideo, document.body)

		if _started and _vertoHandle
			console.log("Client already started, ignoring") if window.rocketDebug
			return

		_videoTag = $("#phonestream")

		_login = login
		_password = password
		_server = server
		_iceConfig = iceConfig

		getConfig()

		$.verto.init({}, bootstrap)

	logout: ->
		if !_vertoHandle
			return

		_vertoHandle.logout()
		_vertoHandle = undefined
		_started = false

	setTabBar: (tabBar) ->
		console.warn  "setting tabBar to ", tabBar
		_tabBars.push tabBar


RocketChat.callbacks.add 'afterLogoutCleanUp', ->
	RocketChat.Phone.logout()
