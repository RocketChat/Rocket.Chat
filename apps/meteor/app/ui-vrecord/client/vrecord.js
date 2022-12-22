import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';

import { VRecDialog } from './VRecDialog';
import { VideoRecorder, UserAction, USER_ACTIVITIES } from '../../ui/client';

/**
 * @typedef {import('meteor/blaze').Blaze.TemplateInstance<{}> & {
 * 	rid: ReactiveVar<string>,
 * 	tmid: ReactiveVar<string | undefined>;
 *  time: ReactiveVar<string>;
 *	chat?: import('../../../client/lib/chats/ChatAPI').ChatAPI;
 * }} VRecDialogTemplateInstance
 */

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

	time() {
		return Template.instance().time.get();
	},
});

const recordingInterval = new ReactiveVar(null);

const stopVideoRecording = (rid, tmid) => {
	if (recordingInterval.get()) {
		clearInterval(recordingInterval.get());
		recordingInterval.set(null);
	}
	UserAction.stop(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
};

Template.vrecDialog.events({
	'click .vrec-dialog .cancel'(e, t) {
		const rid = t.rid.get();
		const tmid = t.tmid.get();

		VideoRecorder.stop();
		VRecDialog.close();
		t.time.set('');
		stopVideoRecording(rid, tmid);
	},

	'click .vrec-dialog .record'(e, t) {
		const rid = t.rid.get();
		const tmid = t.tmid.get();
		if (VideoRecorder.recording.get()) {
			VideoRecorder.stopRecording();
			stopVideoRecording(rid, tmid);
		} else {
			VideoRecorder.record();
			UserAction.performContinuously(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
			t.time.set('00:00');
			const startTime = new Date();
			recordingInterval.set(
				setInterval(() => {
					const now = new Date();
					const distance = (now.getTime() - startTime.getTime()) / 1000;
					const minutes = Math.floor(distance / 60);
					const seconds = Math.floor(distance % 60);
					t.time.set(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
				}, 1000),
			);
		}
	},
	/**
	 * @param {JQuery.ClickEvent} e
	 * @param {VRecDialogTemplateInstance} instance
	 */
	'click .vrec-dialog .ok'(e, instance) {
		const [rid, tmid] = [instance.rid.get(), instance.tmid.get()];
		const cb = (blob) => {
			const fileName = `${TAPi18n.__('Video record')}.webm`;
			const file = new File([blob], fileName, { type: 'video/webm' });
			instance.chat?.flows.uploadFiles([file]);
			VRecDialog.close();
		};
		VideoRecorder.stop(cb);
		instance.time.set('');
		stopVideoRecording(rid, tmid);
	},
});

Template.vrecDialog.onCreated(function () {
	this.width = 400;
	this.height = 290;

	this.rid = new ReactiveVar();
	this.tmid = new ReactiveVar();
	this.time = new ReactiveVar('');
	this.update = ({ rid, tmid, chat }) => {
		this.rid.set(rid);
		this.tmid.set(tmid);
		this.chat = chat;
	};

	this.setPosition = function (dialog, source, anchor = 'left') {
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
				return dialog.css({ top: `${top}px`, right: `${right}px` });
			}
			let left = sourcePos.left - this.width + 100;
			if (left < 0) {
				left = 10;
			}
			return dialog.css({ top: `${top}px`, left: `${left}px` });
		};

		const set = _.debounce(_set, 2000);
		_set();
		this.remove = set;
		$(window).on('resize', set);
	};
});

Template.vrecDialog.onDestroyed(function () {
	VRecDialog.close(this.rid.get());
	$(window).off('resize', this.remove);
});
