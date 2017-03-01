Template.vrecDialog.helpers
	isGuest: ->
		return Meteor.user().guestId

	recordIcon: ->
		if VideoRecorder.cameraStarted.get() and VideoRecorder.recording.get() and !@isGuest
			return 'icon-stop'
		else
			return 'icon-circle'

	okDisabled: ->
		if VideoRecorder.cameraStarted.get() and VideoRecorder.recordingAvailable.get() and !@isGuest
			return ''
		else
			return 'disabled'

	recordDisabled: ->
		if VideoRecorder.cameraStarted.get() and !@isGuest
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
