import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { VariableContext } from 'twilio/lib/rest/serverless/v1/service/environment/variable';

import { VRecDialog } from './VRecDialog';
import { VideoRecorder, fileUpload } from '../../ui';

Template.vrecDialog.helpers({
	recordIcon() {
		if (VideoRecorder.cameraStarted.get() && VideoRecorder.recording.get()) {
			return 'icon-stop';
		}
		return 'icon-circle';
	},

	okDisabled() {
		if (VideoRecorder.cameraStarted.get() && VideoRecorder.recordingAvailable.get()) {
			return '';
		}
		return 'disabled';
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

	'click .vrec-dialog .ok'(e, instance) {
		const [rid, tmid, input] = [instance.rid.get(), instance.tmid.get(), instance.input.get()];
		const cb = (blob) => {
			fileUpload([{ file: blob, type: 'video', name: `${ TAPi18n.__('Video record') }.webm` }], input, { rid, tmid });
			VRecDialog.close();
		};
		VideoRecorder.stop(cb);
	},
});

Template.vrecDialog.onCreated(function() {
	this.rid = new ReactiveVar();
	this.tmid = new ReactiveVar();
	this.input = new ReactiveVar();
	this.update = ({ rid, tmid, input }) => {
		this.rid.set(rid);
		this.tmid.set(tmid);
		this.input.set(input);
	};
});
