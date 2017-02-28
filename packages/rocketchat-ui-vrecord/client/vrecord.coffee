Template.vrecDialog.helpers
	recordIcon: ->
		if VideoRecorder.cameraStarted.get() and VideoRecorder.recording.get()
			return 'icon-stop'
		else
			return 'icon-circle'

	okDisabled: ->
		if VideoRecorder.cameraStarted.get() and VideoRecorder.recordingAvailable.get()
			return ''
		else
			return 'disabled'

	recordDisabled: ->
		if VideoRecorder.cameraStarted.get()
			return ''
		else
			return 'disabled'


Template.vrecDialog.events
	'click .vrec-dialog .cancel': (e, t) ->
		VideoRecorder.stop()
		VRecDialog.close()

	'click .vrec-dialog .record': (e, t) ->
		if VideoRecorder.recording.get()
			VideoRecorder.stopRecording()
		else
			VideoRecorder.record()

	'click .vrec-dialog .ok': (e, t) ->
		cb = (blob) =>
			fileUpload [{ file: blob, type: 'video', name: TAPi18n.__('Video record') + '.webm' }]
			VRecDialog.close()
		VideoRecorder.stop(cb)
