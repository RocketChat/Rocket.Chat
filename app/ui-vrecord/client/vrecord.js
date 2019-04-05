import { VRecDialog } from './VRecDialog';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { VideoRecorder, fileUpload } from '../../ui';

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
	},
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
		const { rid, input } = this;
		const cb = (blob) => {
			fileUpload([{ file: blob, type: 'video', name: `${ TAPi18n.__('Video record') }.webm` }], input, rid);
			VRecDialog.close();
		};
		VideoRecorder.stop(cb);
	},
});
