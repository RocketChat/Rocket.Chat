import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';

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
	this.width = 400;
	this.height = 290;

	this.rid = new ReactiveVar();
	this.tmid = new ReactiveVar();
	this.input = new ReactiveVar();
	this.update = ({ rid, tmid, input }) => {
		this.rid.set(rid);
		this.tmid.set(tmid);
		this.input.set(input);
	};

	this.setPosition = function(dialog, source, anchor = 'left') {
		const _set = () => {
			const sourcePos = $(source).offset();
			let top = sourcePos.top - this.height - 5;

			if (top < 0) {
				top = 10;
			}
			if (anchor === 'left') {
				let right = window.innerWidth - (sourcePos.left + source.offsetWidth - 25);
				if (right < 0) {
					right = 10;
				}
				return dialog.css({ top: `${ top }px`, right: `${ right }px` });
			}
			let left = (sourcePos.left - this.width) + 100;
			if (left < 0) {
				left = 10;
			}
			return dialog.css({ top: `${ top }px`, left: `${ left }px` });
		};

		const set = _.debounce(_set, 2000);
		_set();
		this.remove = set;
		$(window).on('resize', set);
	};
});

Template.vrecDialog.onDestroyed(function() {
	$(window).off('resize', this.remove);
});
