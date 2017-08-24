/* globals fileUpload AudioRecorder KonchatNotification chatMessages */
import toastr from 'toastr';

import mime from 'mime-type/with-db';

import moment from 'moment';

import {VRecDialog} from 'meteor/rocketchat:ui-vrecord';

function katexSyntax() {
	if (RocketChat.katex.katex_enabled()) {
		if (RocketChat.katex.dollar_syntax_enabled()) {
			return '$$KaTeX$$';
		}
		if (RocketChat.katex.parenthesis_syntax_enabled()) {
			return '\\[KaTeX\\]';
		}
	}
	return false;
}

Template.messageBox.helpers({
	roomName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) {
			return '';
		}
		if (roomData.t === 'd') {
			const chat = ChatSubscription.findOne({
				rid: this._id
			}, {
				fields: {
					name: 1
				}
			});
			return chat && chat.name;
		} else {
			return roomData.name;
		}
	},
	showMarkdown() {
		return RocketChat.Markdown;
	},
	showMarkdownCode() {
		return RocketChat.MarkdownCode;
	},
	showKatex() {
		return RocketChat.katex;
	},
	katexSyntax() {
		return katexSyntax();
	},
	showFormattingTips() {
		return RocketChat.settings.get('Message_ShowFormattingTips') && (RocketChat.Markdown || RocketChat.MarkdownCode || katexSyntax());
	},
	canJoin() {
		return Meteor.userId() && RocketChat.roomTypes.verifyShowJoinLink(this._id);
	},
	joinCodeRequired() {
		const code = Session.get(`roomData${ this._id }`);
		return code && code.joinCodeRequired;
	},
	subscribed() {
		return RocketChat.roomTypes.verifyCanSendMessage(this._id);
	},
	allowedToSend() {
		if (RocketChat.roomTypes.readOnly(this._id, Meteor.user())) {
			return false;
		}
		if (RocketChat.roomTypes.archived(this._id)) {
			return false;
		}
		const roomData = Session.get(`roomData${ this._id }`);
		if (roomData && roomData.t === 'd') {
			const subscription = ChatSubscription.findOne({
				rid: this._id
			}, {
				fields: {
					archived: 1,
					blocked: 1,
					blocker: 1
				}
			});
			if (subscription && (subscription.archived || subscription.blocked || subscription.blocker)) {
				return false;
			}
		}
		return true;
	},
	isBlockedOrBlocker() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (roomData && roomData.t === 'd') {
			const subscription = ChatSubscription.findOne({
				rid: this._id
			}, {
				fields: {
					blocked: 1,
					blocker: 1
				}
			});
			if (subscription && (subscription.blocked || subscription.blocker)) {
				return true;
			}
		}
	},
	getPopupConfig() {
		const template = Template.instance();
		return {
			getInput() {
				return template.find('.input-message');
			}
		};
	},
	/* globals MsgTyping*/
	usersTyping() {
		const users = MsgTyping.get(this._id);
		if (users.length === 0) {
			return;
		}
		if (users.length === 1) {
			return {
				multi: false,
				selfTyping: MsgTyping.selfTyping.get(),
				users: users[0]
			};
		}
		let last = users.pop();
		if (users.length > 4) {
			last = t('others');
		}
		let usernames = users.join(', ');
		usernames = [usernames, last];
		return {
			multi: true,
			selfTyping: MsgTyping.selfTyping.get(),
			users: usernames.join(` ${ t('and') } `)
		};
	},
	groupAttachHidden() {
		if (RocketChat.settings.get('Message_Attachments_GroupAttach')) {
			return 'hidden';
		}
	},
	fileUploadEnabled() {
		return RocketChat.settings.get('FileUpload_Enabled');
	},
	fileUploadAllowedMediaTypes() {
		return RocketChat.settings.get('FileUpload_MediaTypeWhiteList');
	},
	showFileUpload() {
		let roomData;
		if (RocketChat.settings.get('FileUpload_Enabled')) {
			roomData = Session.get(`roomData${ this._id }`);
			if (roomData && roomData.t === 'd') {
				return RocketChat.settings.get('FileUpload_Enabled_Direct');
			} else {
				return true;
			}
		} else {
			return RocketChat.settings.get('FileUpload_Enabled');
		}
	},
	showMic() {
		return Template.instance().showMicButton.get();
	},
	showVRec() {
		return Template.instance().showVideoRec.get();
	},
	showSend() {
		if (!Template.instance().isMessageFieldEmpty.get()) {
			return 'show-send';
		}
	},
	showLocation() {
		return RocketChat.Geolocation.get() !== false;
	},
	notSubscribedTpl() {
		return RocketChat.roomTypes.getNotSubscribedTpl(this._id);
	},
	showSandstorm() {
		return Meteor.settings['public'].sandstorm && !Meteor.isCordova;
	},

	anonymousRead() {
		return (Meteor.userId() == null) && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true;
	},
	anonymousWrite() {
		return (Meteor.userId() == null) && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true && RocketChat.settings.get('Accounts_AllowAnonymousWrite') === true;
	}
});

function firefoxPasteUpload(fn) {
	const user = navigator.userAgent.match(/Firefox\/(\d+)\.\d/);
	if (!user || user[1] > 49) {
		return fn;
	}
	return function(event, instance) {
		if ((event.originalEvent.ctrlKey || event.originalEvent.metaKey) && (event.keyCode === 86)) {
			const textarea = instance.find('textarea');
			const {selectionStart, selectionEnd} = textarea;
			const contentEditableDiv = instance.find('#msg_contenteditable');
			contentEditableDiv.focus();
			Meteor.setTimeout(function() {
				const pastedImg = contentEditableDiv.querySelector('img');
				const textareaContent = textarea.value;
				const startContent = textareaContent.substring(0, selectionStart);
				const endContent = textareaContent.substring(selectionEnd);
				const restoreSelection = function(pastedText) {
					textarea.value = startContent + pastedText + endContent;
					textarea.selectionStart = selectionStart + pastedText.length;
					return textarea.selectionEnd = textarea.selectionStart;
				};
				if (pastedImg) {
					contentEditableDiv.innerHTML = '';
				}
				textarea.focus;
				if (!pastedImg || contentEditableDiv.innerHTML.length > 0) {
					return [].slice.call(contentEditableDiv.querySelectorAll('br')).forEach(function(el) {
						contentEditableDiv.replaceChild(new Text('\n'), el);
						return restoreSelection(contentEditableDiv.innerText);
					});
				}
				const imageSrc = pastedImg.getAttribute('src');
				if (imageSrc.match(/^data:image/)) {
					return fetch(imageSrc).then(function(img) {
						return img.blob();
					}).then(function(blob) {
						return fileUpload([
							{
								file: blob,
								name: 'Clipboard'
							}
						]);
					});
				}
			}, 150);
		}
		return fn && fn.apply(this, arguments);
	};
}

Template.messageBox.events({
	'click .join'(event) {
		event.stopPropagation();
		event.preventDefault();
		Meteor.call('joinRoom', this._id, Template.instance().$('[name=joinCode]').val(), (err) => {
			if (err != null) {
				toastr.error(t(err.reason));
			}
			if (RocketChat.authz.hasAllPermission('preview-c-room') === false && RoomHistoryManager.getRoom(this._id).loaded === 0) {
				RoomManager.getOpenedRoomByRid(this._id).streamActive = false;
				RoomManager.getOpenedRoomByRid(this._id).ready = false;
				RoomHistoryManager.getRoom(this._id).loaded = null;
				RoomManager.computation.invalidate();
			}
		});
	},

	'click .register'(event) {
		event.stopPropagation();
		event.preventDefault();
		return Session.set('forceLogin', true);
	},
	'click .register-anonymous'(event) {
		event.stopPropagation();
		event.preventDefault();
		return Meteor.call('registerUser', {}, function(error, loginData) {
			if (loginData && loginData.token) {
				return Meteor.loginWithToken(loginData.token);
			}
		});
	},
	'focus .input-message'(event, instance) {
		KonchatNotification.removeRoomNotification(this._id);
		const input = event.target;
		chatMessages[this._id].input = input;
		if (event.target.value) {
			instance.isMessageFieldEmpty.set(false);
			return typeof input.updateAutogrow === 'function' && input.updateAutogrow();
		}
	},
	'click .send-button'(event, instance) {
		const input = instance.find('.input-message');
		chatMessages[this._id].send(this._id, input, () => {
			// fixes https://github.com/RocketChat/Rocket.Chat/issues/3037
			// at this point, the input is cleared and ready for autogrow
			input.updateAutogrow();
			return instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
		});
		return input.focus();
	},
	'keyup .input-message'(event, instance) {
		chatMessages[this._id].keyup(this._id, event, instance);
		return instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
	},
	'paste .input-message'(e, instance) {
		Meteor.setTimeout(function() {
			const input = instance.find('.input-message');
			return typeof input.updateAutogrow === 'function' && input.updateAutogrow();
		}, 50);
		if (e.originalEvent.clipboardData == null) {
			return;
		}
		const items = [...e.originalEvent.clipboardData.items];
		const files = items.map(item => {
			if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
				e.preventDefault();
				return {
					file: item.getAsFile(),
					name: `Clipboard - ${ moment().format(RocketChat.settings.get('Message_TimeAndDateFormat')) }`
				};
			}
		}).filter(e => e);
		if (files.length) {
			return fileUpload(files);
		} else {
			return instance.isMessageFieldEmpty.set(false);
		}
	},
	'keydown .input-message': firefoxPasteUpload(function(event) {
		return chatMessages[this._id].keydown(this._id, event, Template.instance());
	}),
	'input .input-message'(event) {
		return chatMessages[this._id].valueChanged(this._id, event, Template.instance());
	},
	'propertychange .input-message'(event) {
		if (event.originalEvent.propertyName === 'value') {
			return chatMessages[this._id].valueChanged(this._id, event, Template.instance());
		}
	},
	'click .editing-commands-cancel > button'() {
		return chatMessages[this._id].clearEditing();
	},
	'click .editing-commands-save > button'() {
		return chatMessages[this._id].send(this._id, chatMessages[this._id].input);
	},
	'change .message-form input[type=file]'(event) {
		const e = event.originalEvent || event;
		let files = e.target.files;
		if (!files || files.length === 0) {
			files = (e.dataTransfer && e.dataTransfer.files) || [];
		}
		const filesToUpload = [...files].map(file => {
			// `file.type = mime.lookup(file.name)` does not work.
			Object.defineProperty(file, 'type', {
				value: mime.lookup(file.name)
			});
			return {
				file,
				name: file.name
			};
		});
		return fileUpload(filesToUpload);
	},
	'click .message-buttons.share'(e, t) {
		t.$('.share-items').toggleClass('hidden');
		return t.$('.message-buttons.share').toggleClass('active');
	},
	'click .message-form .message-buttons.location-button'() {
		const roomId = this._id;
		const position = RocketChat.Geolocation.get();
		const latitude = position.coords.latitude;
		const longitude = position.coords.longitude;
		const text = `<div class="location-preview">\n	<img style="height: 250px; width: 250px;" src="https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=250x250&markers=color:gray%7Clabel:%7C${ latitude },${ longitude }&key=${ RocketChat.settings.get('MapView_GMapsAPIKey') }" />\n</div>`;
		return swal({
			title: t('Share_Location_Title'),
			text,
			showCancelButton: true,
			closeOnConfirm: true,
			closeOnCancel: true,
			html: true
		}, function(isConfirm) {
			if (isConfirm !== true) {
				return;
			}
			return Meteor.call('sendMessage', {
				_id: Random.id(),
				rid: roomId,
				msg: '',
				location: {
					type: 'Point',
					coordinates: [longitude, latitude]
				}
			});
		});
	},
	'click .message-form .mic'(e, t) {
		return AudioRecorder.start(function() {
			t.$('.stop-mic').removeClass('hidden');
			return t.$('.mic').addClass('hidden');
		});
	},
	'click .message-form .video-button'(e) {
		return VRecDialog.opened ? VRecDialog.close() : VRecDialog.open(e.currentTarget);
	},
	'click .message-form .stop-mic'(e, t) {
		AudioRecorder.stop(function(blob) {
			return fileUpload([
				{
					file: blob,
					type: 'audio',
					name: `${ TAPi18n.__('Audio record') }.wav`
				}
			]);
		});
		t.$('.stop-mic').addClass('hidden');
		return t.$('.mic').removeClass('hidden');
	},
	'click .sandstorm-offer'() {
		const roomId = this._id;
		return RocketChat.Sandstorm.request('uiView', (err, data) => {
			if (err || !data.token) {
				console.error(err);
				return;
			}
			return Meteor.call('sandstormClaimRequest', data.token, data.descriptor, function(err, viewInfo) {
				if (err) {
					console.error(err);
					return;
				}
				Meteor.call('sendMessage', {
					_id: Random.id(),
					rid: roomId,
					msg: '',
					urls: [
						{
							url: 'grain://sandstorm',
							sandstormViewInfo: viewInfo
						}
					]
				});
			});
		});
	}
});

Template.messageBox.onCreated(function() {
	this.isMessageFieldEmpty = new ReactiveVar(true);
	this.showMicButton = new ReactiveVar(false);
	this.showVideoRec = new ReactiveVar(false);
	return this.autorun(() => {
		const videoRegex = /video\/webm|video\/\*/i;
		const videoEnabled = !RocketChat.settings.get('FileUpload_MediaTypeWhiteList') || RocketChat.settings.get('FileUpload_MediaTypeWhiteList').match(videoRegex);
		if (RocketChat.settings.get('Message_VideoRecorderEnabled') && ((navigator.getUserMedia != null) || (navigator.webkitGetUserMedia != null)) && videoEnabled && RocketChat.settings.get('FileUpload_Enabled')) {
			this.showVideoRec.set(true);
		} else {
			this.showVideoRec.set(false);
		}
		const wavRegex = /audio\/wav|audio\/\*/i;
		const wavEnabled = !RocketChat.settings.get('FileUpload_MediaTypeWhiteList') || RocketChat.settings.get('FileUpload_MediaTypeWhiteList').match(wavRegex);
		if (RocketChat.settings.get('Message_AudioRecorderEnabled') && ((navigator.getUserMedia != null) || (navigator.webkitGetUserMedia != null)) && wavEnabled && RocketChat.settings.get('FileUpload_Enabled')) {
			return this.showMicButton.set(true);
		} else {
			return this.showMicButton.set(false);
		}
	});
});

Meteor.startup(function() {
	RocketChat.Geolocation = new ReactiveVar(false);
	return Tracker.autorun(function() {
		const MapView_GMapsAPIKey = RocketChat.settings.get('MapView_GMapsAPIKey');
		if (RocketChat.settings.get('MapView_Enabled') === true && MapView_GMapsAPIKey && MapView_GMapsAPIKey.length && navigator.geolocation && navigator.geolocation.getCurrentPosition) {
			const success = (position) => {
				return RocketChat.Geolocation.set(position);
			};
			const error = (error) => {
				console.log('Error getting your geolocation', error);
				return RocketChat.Geolocation.set(false);
			};
			const options = {
				enableHighAccuracy: true,
				maximumAge: 0,
				timeout: 10000
			};
			return navigator.geolocation.watchPosition(success, error, options);
		} else {
			return RocketChat.Geolocation.set(false);
		}
	});
});
