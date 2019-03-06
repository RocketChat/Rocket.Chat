import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from 'meteor/tap:i18n';
import { Template } from 'meteor/templating';
import { fileUploadHandler } from 'meteor/rocketchat:file-upload';
import { AudioRecorder, chatMessages } from 'meteor/rocketchat:ui';
import { RoomManager } from 'meteor/rocketchat:ui-utils';
import _ from 'underscore';
import './messageBoxAudioMessage.html';


let audioMessageIntervalId;

Template.messageBoxAudioMessage.events({
	'click .js-audio-message-record'(event, instance) {
		event.preventDefault();
		const recording_icons = instance.findAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');
		const timer = instance.find('.rc-message-box__timer');
		const mic = instance.find('.rc-message-box__icon.mic');

		chatMessages[RoomManager.openedRoom].recording = true;
		AudioRecorder.start(() => {
			const startTime = new Date;
			timer.innerHTML = '00:00';
			audioMessageIntervalId = setInterval(() => {
				const now = new Date;
				const distance = now - startTime;
				let minutes = Math.floor(distance / (1000 * 60));
				let seconds = Math.floor((distance % (1000 * 60)) / 1000);
				if (minutes < 10) { minutes = `0${ minutes }`; }
				if (seconds < 10) { seconds = `0${ seconds }`; }
				timer.innerHTML = `${ minutes }:${ seconds }`;
			}, 1000);

			mic.classList.remove('active');
			recording_icons.forEach((e) => { e.classList.add('active'); });
		});
	},
	'click .js-audio-message-cross'(event, instance) {
		event.preventDefault();
		const timer = instance.find('.rc-message-box__timer');
		const mic = instance.find('.rc-message-box__icon.mic');
		const recording_icons = instance.findAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');

		recording_icons.forEach((e) => { e.classList.remove('active'); });
		mic.classList.add('active');
		timer.innerHTML = '00:00';
		if (audioMessageIntervalId) {
			clearInterval(audioMessageIntervalId);
		}

		AudioRecorder.stop();
		chatMessages[RoomManager.openedRoom].recording = false;
	},
	'click .js-audio-message-check'(event, instance) {
		event.preventDefault();
		const timer = instance.find('.rc-message-box__timer');
		const mic = instance.find('.rc-message-box__icon.mic');
		const loader = instance.find('.js-audio-message-loading');
		const recording_icons = instance.findAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');

		recording_icons.forEach((e) => { e.classList.remove('active'); });
		loader.classList.add('active');
		timer.innerHTML = '00:00';
		if (audioMessageIntervalId) {
			clearInterval(audioMessageIntervalId);
		}

		chatMessages[RoomManager.openedRoom].recording = false;
		AudioRecorder.stop(function(blob) {

			loader.classList.remove('active');
			mic.classList.add('active');
			const roomId = RoomManager.openedRoom;
			const record = {
				name: `${ TAPi18n.__('Audio record') }.mp3`,
				size: blob.size,
				type: 'audio/mp3',
				rid: roomId,
				description: '',
			};
			const upload = fileUploadHandler('Uploads', record, blob);
			let uploading = Session.get('uploading') || [];
			uploading.push({
				id: upload.id,
				name: upload.getFileName(),
				percentage: 0,
			});
			Session.set('uploading', uploading);
			upload.onProgress = function(progress) {
				uploading = Session.get('uploading');

				const item = _.findWhere(uploading, { id: upload.id });
				if (item != null) {
					item.percentage = Math.round(progress * 100) || 0;
					return Session.set('uploading', uploading);
				}
			};

			upload.start(function(error, file, storage) {
				if (error) {
					let uploading = Session.get('uploading');
					if (!Array.isArray(uploading)) {
						uploading = [];
					}

					const item = _.findWhere(uploading, { id: upload.id });

					if (_.isObject(item)) {
						item.error = error.message;
						item.percentage = 0;
					} else {
						uploading.push({
							error: error.error,
							percentage: 0,
						});
					}

					Session.set('uploading', uploading);
					return;
				}

				if (file) {
					Meteor.call('sendFileMessage', roomId, storage, file, () => {
						Meteor.setTimeout(() => {
							const uploading = Session.get('uploading');
							if (uploading !== null) {
								const item = _.findWhere(uploading, {
									id: upload.id,
								});
								return Session.set('uploading', _.without(uploading, item));
							}
						}, 2000);
					});
				}
			});

			Tracker.autorun(function(c) {
				const cancel = Session.get(`uploading-cancel-${ upload.id }`);
				if (cancel) {
					let item;
					upload.stop();
					c.stop();

					uploading = Session.get('uploading');
					if (uploading != null) {
						item = _.findWhere(uploading, { id: upload.id });
						if (item != null) {
							item.percentage = 0;
						}
						Session.set('uploading', uploading);
					}

					return Meteor.setTimeout(function() {
						uploading = Session.get('uploading');
						if (uploading != null) {
							item = _.findWhere(uploading, { id: upload.id });
							return Session.set('uploading', _.without(uploading, item));
						}
					}, 1000);
				}
			});
		});
		return false;
	},
});
