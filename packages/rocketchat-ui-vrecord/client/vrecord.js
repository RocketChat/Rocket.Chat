/* globals VideoRecorder, VRecDialog, fileUpload */

Template.vrecDialog.helpers({
	recordIcon() {
		if (VideoRecorder.cameraStarted.get() && VideoRecorder.recording.get()) {
			return 'icon-stop';
		} else {
			return 'icon-circle';
		}
	},

	okDisabled() {
		if (VideoRecorder.cameraStarted.get() && VideoRecorder.recordingAvailable.get()) {
			return '';
		} else {
			return 'disabled';
		}
	},

	recordDisabled() {
		return VideoRecorder.cameraStarted.get() ? '' : 'disabled';
	}
});


Template.vrecDialog.events({
	'click .vrec-dialog .cancel'() {
		VideoRecorder.stop();
		VRecDialog.close();
	},

	'click .vrec-dialog .record'() {
		if (VideoRecorder.recording.get()) {
			VideoRecorder.stopRecording();
		} else {
			VideoRecorder.record();
		}
	},

	'click .vrec-dialog .ok'() {
		const cb = blob => {
			fileUpload([{ file: blob, type: 'video', name: `${ TAPi18n.__('Video record') }.webm` }]);
			VRecDialog.close();
		};
		VideoRecorder.stop(cb);
	}
});
