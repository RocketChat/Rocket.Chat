import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

import { fileUploadHandler } from '../../../file-upload';
import { settings } from '../../../settings';
import { AudioRecorder, sendOfflineFileMessage } from '../../../ui';
import { call } from '../../../ui-utils';
import { t, SWCache } from '../../../utils';
import './messageBoxAudioMessage.html';
import { ChatMessage } from '../../../models/client';

const setMsgId = (msgData = {}) => {
	let id;
	if (msgData.id) {
		id = msgData.id;
	} else {
		id = Random.id();
	}
	return Object.assign({
		id,
		msg: '',
		groupable: false,
	}, msgData);
};

const startRecording = () => new Promise((resolve, reject) =>
	AudioRecorder.start((result) => (result ? resolve() : reject())));

const stopRecording = () => new Promise((resolve) => AudioRecorder.stop(resolve));

const registerUploadProgress = ({ id }, upload) => {
	const uploading = {
		id: upload.id,
		name: upload.getFileName(),
		percentage: 0,
	};
	ChatMessage.setProgress(id, uploading);
	// Session.set(`uploading-${ upload.id }`, uploading);
};

const updateUploadProgress = ({ id }, upload, { progress, error: { message: error } = {} }) => {
	const uploads = { id: upload.id, name: upload.getFileName() };
	uploads.percentage = Math.round(progress * 100) || 0;
	uploads.error = error;
	ChatMessage.setProgress(id, uploads);
};

const unregisterUploadProgress = ({ id }, upload) => setTimeout(() => {
	const uploads = { id: upload.id, name: upload.getFileName() };
	uploads.percentage = 0;
	ChatMessage.setProgress(id, uploads);
	// Session.set(`uploading-${ upload.id }`, undefined)
	// delete Session.keys[`uploading-${ upload.id }`];
}, 2000);

const uploadRecord = async ({ rid, tmid, blob }) => {
	const msgData = setMsgId({ tmid });
	let offlineFile = null;

	const upload = fileUploadHandler('Uploads', {
		name: `${ t('Audio record') }.mp3`,
		size: blob.size,
		type: 'audio/mpeg',
		rid,
		description: '',
	}, blob);

	blob._id = upload.id;
	upload.onProgress = (progress) => {
		updateUploadProgress(msgData, upload, { progress });
	};

	registerUploadProgress(msgData, upload);

	const offlineUpload = (file, meta) => sendOfflineFileMessage(rid, msgData, file, meta, (file) => {
		offlineFile = file;
	});

	try {
		const [file, storage] = await new Promise((resolve, reject) => {
			upload.start((error, ...args) => (error ? reject(error) : resolve(args)), offlineUpload);
		});

		await call('sendFileMessage', rid, storage, file, msgData, () => {
			if (offlineFile) {
				SWCache.removeFromCache(offlineFile);
			}
		});
	} catch (error) {
		updateUploadProgress(msgData, upload, { error, progress: 0 });
		unregisterUploadProgress(msgData, upload);
	}

	Tracker.autorun((c) => {
		const cancel = Session.get(`uploading-cancel-${ upload.id }`);

		if (!cancel) {
			return;
		}

		upload.stop();
		c.stop();

		updateUploadProgress(msgData, upload, { progress: 0 });
		unregisterUploadProgress(msgData, upload);
	});
};

const recordingInterval = new ReactiveVar(null);
const recordingRoomId = new ReactiveVar(null);

Template.messageBoxAudioMessage.onCreated(function() {
	this.state = new ReactiveVar(null);
	this.time = new ReactiveVar('00:00');
	this.isMicrophoneDenied = new ReactiveVar(false);

	if (navigator.permissions) {
		navigator.permissions.query({ name: 'microphone' })
			.then((permissionStatus) => {
				this.isMicrophoneDenied.set(permissionStatus.state === 'denied');
				permissionStatus.onchange = () => {
					this.isMicrophoneDenied.set(permissionStatus.state === 'denied');
				};
			});
	}
});

Template.messageBoxAudioMessage.helpers({
	isAllowed() {
		return AudioRecorder.isSupported()
			&& !Template.instance().isMicrophoneDenied.get()
			&& settings.get('FileUpload_Enabled')
			&& settings.get('Message_AudioRecorderEnabled')
			&& (!settings.get('FileUpload_MediaTypeWhiteList')
				|| settings.get('FileUpload_MediaTypeWhiteList').match(/audio\/mp3|audio\/\*/i));
	},

	stateClass() {
		if (recordingRoomId.get() && (recordingRoomId.get() !== Template.currentData().rid)) {
			return 'rc-message-box__audio-message--busy';
		}

		const state = Template.instance().state.get();
		return state && `rc-message-box__audio-message--${ state }`;
	},

	time() {
		return Template.instance().time.get();
	},
});

Template.messageBoxAudioMessage.events({
	async 'click .js-audio-message-record'(event, instance) {
		event.preventDefault();

		if (recordingRoomId.get() && (recordingRoomId.get() !== this.rid)) {
			return;
		}

		instance.state.set('recording');

		try {
			await startRecording();

			const startTime = new Date();
			recordingInterval.set(setInterval(() => {
				const now = new Date();
				const distance = (now.getTime() - startTime.getTime()) / 1000;
				const minutes = Math.floor(distance / 60);
				const seconds = Math.floor(distance % 60);
				instance.time.set(`${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`);
			}, 1000));
			recordingRoomId.set(this.rid);
		} catch (error) {
			instance.state.set(null);
		}
	},

	async 'click .js-audio-message-cancel'(event, instance) {
		event.preventDefault();

		if (recordingInterval.get()) {
			clearInterval(recordingInterval.get());
			recordingInterval.set(null);
			recordingRoomId.set(null);
		}

		instance.time.set('00:00');

		await stopRecording();

		instance.state.set(null);
	},

	async 'click .js-audio-message-done'(event, instance) {
		event.preventDefault();

		instance.state.set('loading');

		if (recordingInterval.get()) {
			clearInterval(recordingInterval.get());
			recordingInterval.set(null);
			recordingRoomId.set(null);
		}

		instance.time.set('00:00');

		const blob = await stopRecording();

		instance.state.set(null);

		const { rid, tmid } = this;
		await uploadRecord({ rid, tmid, blob });
	},
});
