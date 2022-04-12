import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { settings } from '../../../settings';
import { AudioRecorder, fileUpload, USER_ACTIVITIES, UserAction } from '../../../ui';
import { t } from '../../../utils';
import './messageBoxAudioMessage.html';

const startRecording = async (rid, tmid) => {
	try {
		await AudioRecorder.start();
		UserAction.performContinuously(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
	} catch (error) {
		throw error;
	}
};

const stopRecording = async (rid, tmid) => {
	const result = await new Promise((resolve) => AudioRecorder.stop(resolve));
	UserAction.stop(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
	return result;
};

const recordingInterval = new ReactiveVar(null);
const recordingRoomId = new ReactiveVar(null);

const clearIntervalVariables = () => {
	if (recordingInterval.get()) {
		clearInterval(recordingInterval.get());
		recordingInterval.set(null);
		recordingRoomId.set(null);
	}
};

const cancelRecording = async (instance, rid, tmid) => {
	clearIntervalVariables();

	instance.time.set('00:00');

	const blob = await stopRecording(rid, tmid);

	instance.state.set(null);

	return blob;
};

Template.messageBoxAudioMessage.onCreated(async function () {
	this.state = new ReactiveVar(null);
	this.time = new ReactiveVar('00:00');
	this.isMicrophoneDenied = new ReactiveVar(false);

	if (navigator.permissions) {
		try {
			const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
			this.isMicrophoneDenied.set(permissionStatus.state === 'denied');
			permissionStatus.onchange = () => {
				this.isMicrophoneDenied.set(permissionStatus.state === 'denied');
			};
			return;
		} catch (error) {
			console.warn(error);
		}
	}

	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		this.isMicrophoneDenied.set(true);
		return;
	}

	try {
		if (!(await navigator.mediaDevices.enumerateDevices()).some(({ kind }) => kind === 'audioinput')) {
			this.isMicrophoneDenied.set(true);
			return;
		}
	} catch (error) {
		console.warn(error);
	}
});

Template.messageBoxAudioMessage.onDestroyed(async function () {
	if (this.state.get() === 'recording') {
		const { rid, tmid } = this.data;
		await cancelRecording(this, rid, tmid);
	}
});

Template.messageBoxAudioMessage.helpers({
	isAllowed() {
		return (
			AudioRecorder.isSupported() &&
			!Template.instance().isMicrophoneDenied.get() &&
			settings.get('FileUpload_Enabled') &&
			settings.get('Message_AudioRecorderEnabled') &&
			(!settings.get('FileUpload_MediaTypeBlackList') || !settings.get('FileUpload_MediaTypeBlackList').match(/audio\/mp3|audio\/\*/i)) &&
			(!settings.get('FileUpload_MediaTypeWhiteList') || settings.get('FileUpload_MediaTypeWhiteList').match(/audio\/mp3|audio\/\*/i))
		);
	},

	stateClass() {
		if (recordingRoomId.get() && recordingRoomId.get() !== Template.currentData().rid) {
			return 'rc-message-box__audio-message--busy';
		}

		const state = Template.instance().state.get();
		return state && `rc-message-box__audio-message--${state}`;
	},

	time() {
		return Template.instance().time.get();
	},
});

Template.messageBoxAudioMessage.events({
	async 'click .js-audio-message-record'(event, instance) {
		event.preventDefault();

		if (recordingRoomId.get() && recordingRoomId.get() !== this.rid) {
			return;
		}

		instance.state.set('recording');

		try {
			await startRecording(this.rid, this.tmid);
			const startTime = new Date();
			recordingInterval.set(
				setInterval(() => {
					const now = new Date();
					const distance = (now.getTime() - startTime.getTime()) / 1000;
					const minutes = Math.floor(distance / 60);
					const seconds = Math.floor(distance % 60);
					instance.time.set(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
				}, 1000),
			);
			recordingRoomId.set(this.rid);
		} catch (error) {
			console.log(error);
			instance.isMicrophoneDenied.set(true);
			instance.state.set(null);
		}
	},

	async 'click .js-audio-message-cancel'(event, instance) {
		event.preventDefault();

		await cancelRecording(instance, this.rid, this.tmid);
	},

	async 'click .js-audio-message-done'(event, instance) {
		event.preventDefault();

		instance.state.set('loading');

		const { rid, tmid } = this;
		const blob = await cancelRecording(instance, rid, tmid);

		await fileUpload([{ file: blob, type: 'video', name: `${t('Audio record')}.mp3` }], { input: blob }, { rid, tmid });
	},
});
