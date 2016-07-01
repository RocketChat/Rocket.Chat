Meteor.startup ->

	if Meteor.isCordova
		return

	Tracker.autorun ->
		user  = Meteor.user()
		if not user
			return

		enabled = RocketChat.settings.get('Phone_Enabled')
		wss = RocketChat.settings.get('Phone_WSS')

		if not enabled or not wss
			console.log("Phone not enabled or missing server url") if window.rocketDebug
			return

		plogin = user.phonelogin
		ppass = user.phonepassword

		if not plogin or not ppass
			console.log("Phone account data not set (yet)") if window.rocketDebug
			return

		RocketChat.Phone.start(plogin, ppass, wss)


Template.phone.events
	'click #phone_settings': (e, instance) ->
		showSettings =  instance.showSettings.get()
		instance.showSettings.set(!showSettings)

	'click .button.dialkey': (e, instance) ->
		value = _.trim $(e.target).val()
		display = instance.phoneDisplay.get()
		instance.phoneDisplay.set(display + value)
		RocketChat.Phone.dtmf(value)

	'change #phone-display': (e, instance) ->
		value = _.trim $(e.target).val()
		instance.phoneDisplay.set(value)

	'keypress #phone-display': (e, instance) ->
		if e.keyCode == 13
			number = instance.phoneDisplay.get()
			RocketChat.Phone.newCall(number)

	'click #phone-dial': (e, instance)->
		if window.rocketDebug
			console.log "will dial"

		number = instance.phoneDisplay.get()
		RocketChat.Phone.dialKey(number)
		instance.phoneDisplay.set('')

	'click #phone-hangup': (e, instance)->
		if window.rocketDebug
			console.log "hangup"

		RocketChat.Phone.hangup()
		instance.phoneDisplay.set('')

	'click #phone-hold': (e, instance)->
		if window.rocketDebug
			console.log "toggle hold"

		status = RocketChat.Phone.toggleHold()
		if status
			$('#phone-hold').addClass('phone-active-key')
		else
			$('#phone-hold').removeClass('phone-active-key')

	'click #phone-mute': (e, instance)->
		if window.rocketDebug
			console.log "toggle mute"
		status = RocketChat.Phone.toggleMute()
		if status
			$('#phone-mute').addClass('phone-active-key')
		else
			$('#phone-mute').removeClass('phone-active-key')

	'click #phone-redial': (e, instance)->
		if window.rocketDebug
			console.log "redialing...."

		lastCalled = RocketChat.Phone.getLastCalled()
		instance.phoneDisplay.set(lastCalled)
		RocketChat.Phone.redial()

	'click #phone-clear': (e, instance)->
		if window.rocketDebug
			console.log "clearing display"

		instance.phoneDisplay.set('')

	'click #phone-transfer': (e, instance)->
		if window.rocketDebug
			console.log "transferring call..."

		number = instance.phoneDisplay.get()
		RocketChat.Phone.transfer(number)

	'click .button.fullscreen': (e, instance) ->
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


Template.phone.helpers
	phoneDisplay: ->
		return Template.instance().phoneDisplay.get()

	showSettings: ->
		return Template.instance().showSettings.get()


Template.phone.onCreated ->
	@showSettings = new ReactiveVar false
	@phoneDisplay = new ReactiveVar ""


Template.phone.onRendered ->
	if window.rocketDebug
		console.log("Moving video tag to its containter")

	RocketChat.Phone.placeVideo()


RocketChat.Phone = new class
	_started = false
	_login = undefined
	_password = undefined
	_vertoHandle = undefined
	_server = undefined
	_videoTag = undefined

	_lastCalled = ''

	_onHold = false
	_isMute = false

	_curCall = null

	_audioInDevice = undefined
	_audioOutDevice = undefined
	_videoDevice = null

	_callState = null

	_curResolutions = null
	_curVideoW = null
	_curVideoH = null

	constructor: ->
		if window.rocketDebug
			console.log("Starting a new Phone Handler")

	answer = ->
		if window.rocketDebug
			console.log "Will answer call"

		$("#phonestream").css('display', 'block')

		has_video = false
		if _videoDevice and (_videoDevice != "none")
			has_video = true

		_curCall.answer({
			useVideo: has_video,
			useStereo: true,
			useCamera: _videoDevice,
			useSpeak: _audioOutDevice || "none",
			useMic: _audioInDevice || "none",
		}, {})

	onWSLogin = (verto, success) ->
		if window.rocketDebug
			console.log('onWSLogin', success)

	onWSClose = (verto, success) ->
		if window.rocketDebug
			console.log('onWSClose', success)

	onDialogState = (d) ->
		if window.rocketDebug
			console.log('on rocket dialog ', d)

		if !_curCall?
			_curCall = d

		switch d.state.name
			when 'ringing'
				_callState = 'ringing'
				RocketChat.TabBar.setTemplate "phone", ->
					msg = "Incoming call from " + d.params.caller_id_number
					putNotification(msg)
					notification =
						title: "Phone Call"
						text: "Incoming call from " + d.params.caller_id_number
						payload:
							rid: Session.get('openedRoom')
							sender: Meteor.user()

					KonchatNotification.showDesktop notification
			when 'active'
				_callState = 'active'
			when 'hangup'
				if _callState != 'transfer'
					if window.rocketDebug
						console.log("hangup call")
					_curCall.hangup()

				_callState = 'hangup'
				_curCall = null
				clearNotification()
			when 'destroy'
				if _callState != 'transfer' and _callState != 'hangup'
					if window.rocketDebug
						console.log("hangup call")
					_curCall.hangup()

				_callState = null
				_curCall = null
				clearNotification()

	clearNotification = ->
		$(".phone-notifications").text('')
		$(".phone-notifications").css('display', 'none')

	putNotification = (msg) ->
		$(".phone-notifications").text(msg)
		$(".phone-notifications").css('display', 'block')

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

		_vertoHandle = new jQuery.verto({
			login: _login,
			passwd: _password
			socketUrl: _server,
			ringFile: 'sounds/bell_ring2.wav',
			iceServers: true,
			tag: "phonestream"
			audioParams: {
				googEchoCancellation: true,
				googNoiseSuppression: true,
				googHighpassFilter: true
			},
			sessid: $.verto.genUUID(),
			deviceParams: {
				useCamera: _videoDevice,
				onResCheck: refreshVideoResolution
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

	refreshDevices = (what) ->
		if window.rocketDebug
			console.log ">>>>>>>>>> REFRESH DEVICES <<<<<<<<<<<<"
			console.log what
			console.log ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"

		if _videoDevice
			$.FSRTC.getValidRes(_videoDevice, refreshVideoResolution)

	placeVideo: ->
		_videoTag.appendTo($("#phone-video"))
		_videoTag.css('visibility', 'visible')
		_videoTag.css('display', 'none')

	transfer: (number) ->
		if _curCall and _callState is 'active'
			_callState = 'transfer'
			_curCall.transfer(number)

	getLastCalled: ->
		return _lastCalled

	redial: () ->
		if !_curCall? and _callState is null
			@newCall(_lastCalled)

	toggleMute: () ->
		if !_curCall?
			return

		_isMute = !_isMute
		_curCall.setMute('toggle')
		return _isMute

	toggleHold: () ->
		if !_curCall?
			return

		_onHold = !_onHold
		_curCall.toggleHold()
		return _onHold

	dtmf: (key) ->
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

	dialKey: (number) ->
		if !_curCall? and _callState is null
			@newCall(number)
			return

		if _callState is 'ringing'
			answer()
			return

		console.log('What Im doing here: ', _callState, ' ', _curCall)

	newCall: (destination) ->
		if !destination or destination is ''
			console.log("No number provided") if window.rocketDebug
			return

		if _curCall?
			console.log("Cannot call while in call") if window.rocketDebug
			return

		has_mic = RocketChat.Phone.getAudioInDevice()
		has_speak = RocketChat.Phone.getAudioOutDevice()
		if !has_mic? or !has_speak? or has_mic is "none" or has_speak is "none"
			console.log("not mic and speaker defined, should refuse call?") if window.rocketDebug
			#return # firefox still has issues in device selection

		has_video = false
		if _videoDevice and (_videoDevice != "none")
			has_video = true

		_curCall = _vertoHandle.newCall({
			destination_number: destination,
			useVideo: has_video,
			useStereo: true,
			useCamera: _videoDevice,
			useSpeak: _audioOutDevice || "none",
			useMic: _audioInDevice || "none",
		}, {
			onDialogState: onDialogState
		})
		_lastCalled = destination

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

	setVideoDevice: (id) ->
		if id is 'none'
			id = null
		_videoDevice = id
		setConfig()

	getVideoDevice: ->
		return _videoDevice

	start: (login, password, server) ->
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

		getConfig()

		$.verto.init({}, bootstrap)

