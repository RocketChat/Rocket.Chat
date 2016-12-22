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
