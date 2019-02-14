import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { fileUploadHandler } from 'meteor/rocketchat:file-upload';
import { AudioRecorder, chatMessages } from 'meteor/rocketchat:ui';
import { call } from 'meteor/rocketchat:ui-utils';
import { t } from 'meteor/rocketchat:utils';
import './messageBoxAudioMessage.html';

const startRecording = () => new Promise((resolve) => AudioRecorder.start(resolve));

const stopRecording = () => new Promise((resolve) => AudioRecorder.stop(resolve));

const registerUploadProgress = (upload) => {
	const uploads = Session.get('uploading') || [];
	Session.set('uploading', [...uploads, {
		id: upload.id,
		name: upload.getFileName(),
		percentage: 0,
	}]);
};

const updateUploadProgress = (upload, { progress, error: { message: error } = {} }) => {
	const uploads = Session.get('uploading') || [];
	const item = uploads.find(({ id }) => id === upload.id) || {
		id: upload.id,
		name: upload.getFileName(),
	};
	item.percentage = Math.round(progress * 100) || 0;
	item.error = error;
	Session.set('uploading', uploads);
};

const unregisterUploadProgress = (upload) => setTimeout(() => {
	const uploads = Session.get('uploading') || [];
	Session.set('uploading', uploads.filter(({ id }) => id !== upload.id));
}, 2000);

const uploadRecord = async({ rid, blob }) => {
	const upload = fileUploadHandler('Uploads', {
		name: `${ t('Audio record') }.mp3`,
		size: blob.size,
		type: 'audio/mpeg',
		rid,
		description: '',
	}, blob);

	upload.onProgress = (progress) => {
		updateUploadProgress(upload, { progress });
	};

	registerUploadProgress(upload);

	try {
		const [file, storage] = await new Promise((resolve, reject) => {
			upload.start((error, ...args) => (error ? reject(error) : resolve(args)));
		});

		await call('sendFileMessage', rid, storage, file);

		unregisterUploadProgress(upload);
	} catch (error) {
		updateUploadProgress(upload, { error, progress: 0 });
		unregisterUploadProgress(upload);
	}

	Tracker.autorun((c) => {
		const cancel = Session.get(`uploading-cancel-${ upload.id }`);

		if (!cancel) {
			return;
		}

		upload.stop();
		c.stop();

		updateUploadProgress(upload, { progress: 0 });
		unregisterUploadProgress(upload);
	});
};

const recordingInterval = new ReactiveVar(null);
const recordingRoomId = new ReactiveVar(null);

Template.messageBoxAudioMessage.onCreated(function() {
	this.state = new ReactiveVar(null);
	this.time = new ReactiveVar('00:00');
});

Template.messageBoxAudioMessage.helpers({
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

		chatMessages[this.rid].recording = true;
		instance.state.set('recording');

		await startRecording();

		const startTime = new Date;
		recordingInterval.set(setInterval(() => {
			const now = new Date;
			const distance = (now.getTime() - startTime.getTime()) / 1000;
			const minutes = Math.floor(distance / 60);
			const seconds = Math.floor(distance % 60);
			instance.time.set(`${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`);
		}, 1000));
		recordingRoomId.set(this.rid);
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
		chatMessages[this.rid].recording = false;
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
		chatMessages[this.rid].recording = false;

		await uploadRecord({ rid: this.rid, blob });
	},
});
