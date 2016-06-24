Meteor.startup ->

	Tracker.autorun ->
		user  = Meteor.user()
		if not user
			return

		enabled = RocketChat.settings.get('Phone_Enabled')
		wss = RocketChat.settings.get('Phone_WSS')

		if not enabled or not wss
			console.log("Phone not enabled or missing server url")
			return

		plogin = user.phonelogin
		ppass = user.phonepassword

		if not plogin or not ppass
			console.log("Phone account data not set (yet)")
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
		console.log "will dial"
		number = instance.phoneDisplay.get()
		RocketChat.Phone.dialKey(number)

	'click #phone-hangup': (e, instance)->
		console.log "hangup"
		RocketChat.Phone.hangup()

	'click #phone-hold': (e, instance)->
		console.log "toggle hold"
		status = RocketChat.Phone.toggleHold()
		if status
			$('#phone-hold').addClass('phone-active-key')
		else
			$('#phone-hold').removeClass('phone-active-key')

	'click #phone-mute': (e, instance)->
		console.log "toggle mute"
		status = RocketChat.Phone.toggleMute()
		if status
			$('#phone-mute').addClass('phone-active-key')
		else
			$('#phone-mute').removeClass('phone-active-key')

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
	console.log("Moving video tag to its containter")
	$("#phonestream").appendTo($("#phone-video"))
	$("#phonestream").css('visibility', 'visible')
	$("#phonestream").css('display', 'none')


RocketChat.Phone = new class
	_started = false
	_login = undefined
	_password = undefined
	_vertoHandle = undefined
	_server = undefined

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
		console.log("Starting a new Phone Handler")

	answer = ->
		console.log "Will answer call"
		$("#phonestream").css('display', 'block')

		has_video = false
		if _videoDevice and (_videoDevice != "none")
			has_video = true

		_curCall.answer({
			caller_id_name: "canemorto",
			caller_id_number: 1234,
			useVideo: has_video,
			useStereo: true,
			useCamera: _videoDevice,
			useSpeak: _audioOutDevice || "none",
			useMic: _audioInDevice || "none",
		}, {})

	onWSLogin = (verto, success) ->
		console.log('onWSLogin', success)

	onWSClose = (verto, success) ->
		console.log('onWSClose', success)

	onDialogState = (d) ->
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
				_curCall.hangup()
				_callState = 'hangup'
				_curCall = null
				clearNotification()
			when 'destroy'
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
		console.log ">>>>>>>>>< RESOLUTIONS >>>>>>>>>>>>>>>>>>"
		console.log resolutions
		_curResolutions = resolutions.validRes
		console.log ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"

	bootstrap = (status) =>
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
		console.log ">>>>>>>>>> REFRESH DEVICES <<<<<<<<<<<<"
		console.log what
		console.log ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
		if _videoDevice
			$.FSRTC.getValidRes(_videoDevice, refreshVideoResolution)

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
		has_mic = RocketChat.Phone.getAudioInDevice()
		has_speak = RocketChat.Phone.getAudioOutDevice()
		if !has_mic? or !has_speak? or has_mic is "none" or has_speak is "none"
			console.log "not mic and speaker defined, refusing call"
			#return

		has_video = false
		if _videoDevice and (_videoDevice != "none")
			has_video = true

		_curCall = _vertoHandle.newCall({
			destination_number: destination,
			caller_id_name: "canemorto",
			caller_id_number: 1234,
			useVideo: has_video,
			useStereo: true,
			useCamera: _videoDevice,
			useSpeak: _audioOutDevice || "none",
			useMic: _audioInDevice || "none",
		}, {
			onDialogState: onDialogState
		})

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
			console.log wxh
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

		if _started and (login != _login or _password != password or _server != server)
			_vertoHandle.logout()
			_vertoHandle = undefined
			console.log("Restarting an already started client")

		if !_started
			console.log("Activating video element")
			Blaze.render(Template.phonevideo, document.body)

		_login = login
		_password = password
		_server = server

		getConfig()

		$.verto.init({}, bootstrap)

