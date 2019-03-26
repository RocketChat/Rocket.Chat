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
		let isInReplyView;
		if (instance.parentTemplate(2) && instance.parentTemplate(2).data.tabBar) {
			isInReplyView = instance.parentTemplate(2).data.tabBar.template.curValue === 'RocketReplies';
		}
		let recording_icons = $('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box').not('.contextual-bar .rc-message-box__icon.check, .contextual-bar .rc-message-box__icon.cross, .contextual-bar .rc-message-box__timer-box');
		let timer = $('.rc-message-box__timer').not('.contextual-bar .rc-message-box__timer');
		let mic = $('.rc-message-box__icon.mic').not('.contextual-bar .rc-message-box__icon.mic');

		if (isInReplyView) {
			recording_icons = $('.contextual-bar .rc-message-box__icon.check, .contextual-bar .rc-message-box__icon.cross, .contextual-bar .rc-message-box__timer-box');
			timer = $('.contextual-bar .rc-message-box__timer');
			mic = $('.contextual-bar .rc-message-box__icon.mic');
		} 

		chatMessages[RoomManager.openedRoom].recording = true;
		AudioRecorder.start(() => {
			const startTime = new Date;
			timer.html = '00:00';
			audioMessageIntervalId = setInterval(() => {
				const now = new Date;
				const distance = now - startTime;
				let minutes = Math.floor(distance / (1000 * 60));
				let seconds = Math.floor((distance % (1000 * 60)) / 1000);
				if (minutes < 10) { minutes = `0${ minutes }`; }
				if (seconds < 10) { seconds = `0${ seconds }`; }
				timer.html = `${ minutes }:${ seconds }`;
			}, 1000);

			mic.removeClass('active');
			recording_icons.each(function () { $(this).addClass('active'); });

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
		let isInReplyView;
		if (instance.parentTemplate(2) && instance.parentTemplate(2).data.tabBar) {
			isInReplyView = instance.parentTemplate(2).data.tabBar.template.curValue === 'RocketReplies';
		}

		let timer = $('.rc-message-box__timer').not('.contextual-bar .rc-message-box__timer');
		let mic = $('.rc-message-box__icon.mic').not('.contextual-bar .rc-message-box__icon.mic');
		let loader = $('.js-audio-message-loading').not('.contextual-bar .js-audio-message-loading');
		let recording_icons = $('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box').not('.contextual-bar .rc-message-box__icon.check, .contextual-bar  .rc-message-box__icon.cross, .contextual-bar .rc-message-box__timer-box');

		if (isInReplyView) {
			timer = $('.contextual-bar .rc-message-box__timer');
			mic = $('.contextual-bar .rc-message-box__icon.mic');
			loader = $('.contextual-bar .js-audio-message-loading');
			recording_icons = $('.contextual-bar .rc-message-box__icon.check, .contextual-bar  .rc-message-box__icon.cross, .contextual-bar .rc-message-box__timer-box');
		}

		recording_icons.each(function () { $(this).removeClass('active'); });
		loader.addClass('active');
		timer.html('00:00');
		if (audioMessageIntervalId) {
			clearInterval(audioMessageIntervalId);
		}

		chatMessages[RoomManager.openedRoom].recording = false;
		AudioRecorder.stop(function(blob) {

			loader.removeClass('active');
			mic.addClass('active');
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
				if (!file.customFields) {
					file.customFields = {};
				}

				let parentMessage;
				if (isInReplyView) {
					parentMessage = $('section[id^="chat-window"] > div > div.contextual-bar > section > main > footer > div > label > textarea').data('reply');
					file.customFields = { ref: parentMessage[0]._id };
				}
				if (file) {
					Meteor.call('sendFileMessage', roomId, storage, file, () => {
						if (isInReplyView) {
							if (!parentMessage[0].customFields.replyIds) parentMessage[0].customFields.replyIds = [];
							parentMessage[0].customFields.replyIds.push(file._id);
							let replyIds = parentMessage[0].customFields.replyIds;
							Meteor.call('addMessageReply', { _id: parentMessage[0]._id, customFields: { replyIds } });
						}
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
