import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { fileUploadHandler } from 'meteor/rocketchat:file-upload';
import { RoomManager, AudioRecorder, chatMessages } from 'meteor/rocketchat:ui';
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

let recordingInterval = null;
let recordingRoomId = null;

Template.messageBoxAudioMessage.events({
	async 'click .js-audio-message-record'(event, instance) {
		event.preventDefault();

		chatMessages[RoomManager.openedRoom].recording = true;
		instance.firstNode.classList.add('rc-message-box__audio-message--recording');

		const timer = instance.find('.rc-message-box__audio-message-timer-text');
		timer.innerHTML = '00:00';

		await startRecording();

		const startTime = new Date;
		recordingInterval = setInterval(() => {
			const now = new Date;
			const distance = (now.getTime() - startTime.getTime()) / 1000;
			const minutes = Math.floor(distance / 60);
			const seconds = Math.floor(distance % 60);
			timer.innerText = `${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`;
		}, 1000);
		recordingRoomId = this.rid;
	},

	async 'click .js-audio-message-cancel'(event, instance) {
		event.preventDefault();

		const timer = instance.find('.rc-message-box__audio-message-timer-text');
		timer.innerHTML = '00:00';

		if (recordingInterval) {
			clearInterval(recordingInterval);
			recordingInterval = null;
			recordingRoomId = null;
		}

		await stopRecording();

		instance.firstNode.classList.remove('rc-message-box__audio-message--recording');
		chatMessages[RoomManager.openedRoom].recording = false;
	},

	async 'click .js-audio-message-done'(event, instance) {
		event.preventDefault();

		instance.firstNode.classList.remove('rc-message-box__audio-message--recording');
		instance.firstNode.classList.add('rc-message-box__audio-message--loading');

		const timer = instance.find('.rc-message-box__audio-message-timer-text');

		timer.innerHTML = '00:00';
		if (recordingInterval) {
			clearInterval(recordingInterval);
			recordingInterval = null;
			recordingRoomId = null;
		}

		const blob = await stopRecording();

		instance.firstNode.classList.remove('rc-message-box__audio-message--loading');
		chatMessages[RoomManager.openedRoom].recording = false;

		await uploadRecord({ rid: this.rid, blob });
	},
});
