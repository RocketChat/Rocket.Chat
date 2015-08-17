class @AudioRecorder
	constructor: (cb) ->
		window.AudioContext = window.AudioContext or window.webkitAudioContext
		navigator.getUserMedia = navigator.getUserMedia or navigator.webkitGetUserMedia
		window.URL = window.URL or window.webkitURL

		@audio_context = new AudioContext

		ok = (stream) =>
			@startUserMedia(stream)
			cb?.call(@)

		navigator.getUserMedia {audio: true}, ok, (e) ->
			console.log('No live audio input: ' + e)

	startUserMedia: (stream) ->
		input = @audio_context.createMediaStreamSource(stream)
		@recorder = new Recorder(input, {workerPath: '/recorderWorker.js'})

	startRecording: (button) ->
		@recorder.record()

	stopRecording: (cb) ->
		@recorder.stop()

		if cb?
			@getBlob cb

		@recorder.clear()

	getBlob: (cb) ->
		@recorder.exportWAV cb