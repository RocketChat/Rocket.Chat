@AudioRecorder = new class
	start: (cb) ->
		window.AudioContext = window.AudioContext or window.webkitAudioContext
		navigator.getUserMedia = navigator.getUserMedia or navigator.webkitGetUserMedia
		window.URL = window.URL or window.webkitURL

		@audio_context = new AudioContext

		ok = (stream) =>
			@startUserMedia(stream)
			cb?.call(@)

		if not navigator.getUserMedia?
			return cb false

		navigator.getUserMedia {audio: true}, ok, (e) ->
			console.log('No live audio input: ' + e)

	startUserMedia: (stream) ->
		@stream = stream
		input = @audio_context.createMediaStreamSource(stream)
		@recorder = new Recorder(input, {workerPath: '/recorderWorker.js'})
		@recorder.record()

	stop: (cb) ->
		@recorder.stop()

		if cb?
			@getBlob cb

		@stream.getAudioTracks()[0].stop()

		@recorder.clear()

		delete @audio_context
		delete @recorder
		delete @stream

	getBlob: (cb) ->
		@recorder.exportWAV cb

	startIos: (stopcb) ->
		ok = (mediaFiles) =>
			file = mediaFiles[0]
			console.log('path', file.fullPath)
			console.log('f is', file.name, file.localURL, file.type, file.size)
			reader = new FileReader()
			f = new window.File file.name, file.localURL, file.type, file.lastModified, file.size
			if not f.type?
				f.type = 'audio/wav'
				console.log('fixed f is', file.name, file.local, file.size)
			fileUpload [{
						file: f
						type: 'audio'
						name: TAPi18n.__('Audio record') + '.wav'
						}]
			@stopIos stopcb

		navigator.device.capture.captureAudio ok, (e) ->
			console.log('Error while capturing audio: ', e)

	stopIos: (cb) ->
		cb?.call(@)


RocketChat.Device = new class
	isIos: () ->
		Meteor.isCordova and Boolean(navigator.userAgent.match(/(iPad|iPhone|iPod)/g))

	isAndroid: () ->
		Meteor.isCordova and (navigator.userAgent.toLowerCase().indexOf("android") > -1)
