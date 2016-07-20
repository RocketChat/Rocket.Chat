@VideoRecorder = new class
	started: false
	cameraStarted: new ReactiveVar false
	recording: new ReactiveVar false
	recordingAvailable: new ReactiveVar false

	start: (videoel, cb) ->
		navigator.getUserMedia = navigator.getUserMedia or navigator.webkitGetUserMedia or navigator.mozGetUserMedia
		window.URL = window.URL or window.webkitURL

		@videoel = videoel
		ok = (stream) =>
			@startUserMedia(stream)
			cb?.call(@)

		if not navigator.getUserMedia?
			return cb false

		navigator.getUserMedia {audio: true, video: true}, ok, (e) ->
			console.log('No live video input: ' + e)

	record: ->
		@chunks = []
		if not @stream?
			return
		@mediaRecorder = new MediaRecorder(@stream)
		@mediaRecorder.stream = @stream
		@mediaRecorder.mimeType = 'video/webm'
		@mediaRecorder.ondataavailable = (blobev) =>
			@chunks.push(blobev.data)
			if not @recordingAvailable.get()
				@recordingAvailable.set true
		@mediaRecorder.start()
		@recording.set true

	startUserMedia: (stream) ->
		@stream = stream
		@videoel.src = URL.createObjectURL(stream)
		@videoel.onloadedmetadata = (e) =>
			@videoel.play()

		@started = true
		@cameraStarted.set true

	stop: (cb) ->
		if @started
			@stopRecording()

			if @stream?
				vtracks = @stream.getVideoTracks()[0]
				if vtracks
					vtracks.stop()

			if @videoel?
				@videoel.pause
				@videoel.src = ''

			@started = false
			@cameraStarted.set false
			@recordingAvailable.set false

			if cb? and @chunks?
				blob = new Blob(@chunks, { 'type' :  'video/webm' })
				cb(blob)

			delete @recorder
			delete @stream
			delete @videoel

	stopRecording: ->
		if @started and @recording and @mediaRecorder?
			@mediaRecorder.stop()
			@recording.set false
			delete @mediaRecorder
