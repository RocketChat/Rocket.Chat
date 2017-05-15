readAsArray = (file, callback) ->
        reader = new FileReader()
        reader.onload = (ev) ->
                callback ev.target.result, file

        reader.readAsArrayBuffer file

@AudioRecorder = new class
	start: (cb) ->
		window.AudioContext = window.AudioContext or window.webkitAudioContext
		navigator.getUserMedia = navigator.getUserMedia or navigator.webkitGetUserMedia
		window.URL = window.URL or window.webkitURL

		window.audioContext = new AudioContext

		ok = (stream) =>
			@startUserMedia(stream)
			cb?.call(@)

		if not navigator.getUserMedia?
			return cb false

		navigator.getUserMedia {audio: true}, ok, (e) ->
			console.log('No live audio input: ' + e)

	startUserMedia: (stream) ->
		@stream = stream
		input = window.audioContext.createMediaStreamSource(stream)
		@recorder = new Recorder(input, {workerPath: '/recorderWorker.js'})
		@recorder.record()

	stop: (cb) ->
		@recorder.stop()

		if cb?
			@getBlob cb

		@stream.getAudioTracks()[0].stop()

		@recorder.clear()

		window.audioContext.close()
		delete window.audioContext
		delete @recorder
		delete @stream

	getBlob: (cb) ->
		@recorder.exportWAV cb

	startIos: (stopcb) ->
		ok = (mediaFiles) =>
			file = mediaFiles[0]
			if not file
				@stopIos stopcb
				return

			f = new window.File file.name, file.localURL, file.type, file.lastModified, file.size
			if not f.type?
				f.type = 'audio/wav'
			readAsArray f, (fcontent) =>
				blob = new Blob [fcontent], type: f.type
				fileUpload [{
							file: blob
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
