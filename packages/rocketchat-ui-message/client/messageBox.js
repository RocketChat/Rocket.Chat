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

function applyMd(e, t) {
	e.preventDefault();
	const box = t.find('.js-input-message');
	const {selectionEnd = box.value.length, selectionStart = 0} = box;
	const initText = box.value.slice(0, selectionStart);
	const selectedText = box.value.slice(selectionStart, selectionEnd);
	const finalText = box.value.slice(selectionEnd, box.value.length);

	const [btn] = t.findAll(`.js-md[aria-label=${ this.label }]`);
	if (btn) {
		btn.classList.add('active');
		setTimeout(function() {
			btn.classList.remove('active');
		}, 100);
	}
	box.focus();

	// removes markdown if selected text in inside the same clicked markdown
	const startPattern = this.pattern.substr(0, this.pattern.indexOf('{{text}}'));
	const startPatternFound = [...startPattern].reverse().every((char, index) => {
		return box.value.substr(selectionStart - index - 1, 1) === char;
	});

	if (startPatternFound) {
		const endPattern = this.pattern.substr(this.pattern.indexOf('{{text}}') + '{{text}}'.length);
		const endPatternFound = [...endPattern].every((char, index) => {
			return box.value.substr(selectionEnd + index, 1) === char;
		});

		if (endPatternFound) {
			box.selectionStart = selectionStart - startPattern.length;
			box.selectionEnd = selectionEnd + endPattern.length;

			if (document.execCommand) {
				document.execCommand('insertText', false, selectedText);
			} else {
				box.value = initText.substr(0, initText.length - startPattern.length) + selectedText + finalText.substr(endPattern.length);
			}
			box.selectionStart = selectionStart - startPattern.length;
			box.selectionEnd = box.selectionStart + selectedText.length;
			$(box).change();
			return;
		}
	}

	/*
		get text
		apply pattern
		restore selection
	*/
	if (document.execCommand) {
		document.execCommand('insertText', false, this.pattern.replace('{{text}}', selectedText));
	} else {
		box.value = initText + this.pattern.replace('{{text}}', selectedText) + finalText;
	}
	box.selectionStart = selectionStart + this.pattern.indexOf('{{text}}');
	box.selectionEnd = box.selectionStart + selectedText.length;
	$(box).change();
}


const markdownButtons = [
	{
		label: 'bold',
		pattern: '*{{text}}*',
		group: 'showMarkdown',
		command: 'b'
	},
	{
		label: 'italic',
		pattern: '_{{text}}_',
		group: 'showMarkdown',
		command: 'i'
	},
	{
		label: 'strike',
		pattern: '~{{text}}~',
		group: 'showMarkdown'
	},
	{
		label: 'inline_code',
		pattern: '`{{text}}`',
		group: 'showMarkdownCode'
	},
	{
		label: 'multi_line',
		pattern: '```\n{{text}}\n``` ',
		group: 'showMarkdownCode'
	}
];

Template.messageBox.helpers({
	toString(obj) {
		return JSON.stringify(obj);
	},
	columns() {
		const groups = RocketChat.messageBox.actions.get();
		const sorted = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
		const totalColumn = sorted.reduce((total, key) => total + groups[key].length, 0);
		const totalPerColumn = Math.ceil(totalColumn / 2);
		const columns = [];

		let counter = 0;
		let index = 0;
		sorted.forEach(key => {
			const actions = groups[key];
			columns[index] = columns[index] || [];
			counter += actions.length;
			columns[index].push({name: key, actions});

			if (counter > totalPerColumn) {
				counter = 0;
				index++;
			}
		});

		return columns;
	},
	mdButtons() {
		return markdownButtons;
	},
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
				return template.find('.js-input-message');
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
	},
	sendIcon() {
		return Template.instance().sendIcon.get();
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
	'click .js-message-actions .rc-popover__item'(event, instance) {
		this.action.apply(this, [{rid: Template.parentData()._id, messageBox: instance.find('.rc-message-box'), element: $(event.target).parent('.rc-popover__item')[0], event}]);
	},
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
	'focus .js-input-message'(event, instance) {
		KonchatNotification.removeRoomNotification(this._id);
		chatMessages[this._id].input = instance.find('.js-input-message');
	},
	'click .js-send'(event, instance) {
		const input = instance.find('.js-input-message');
		chatMessages[this._id].send(this._id, input, () => {
			// fixes https://github.com/RocketChat/Rocket.Chat/issues/3037
			// at this point, the input is cleared and ready for autogrow
			input.updateAutogrow();
			return instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
		});
		return input.focus();
	},
	'keyup .js-input-message'(event, instance) {
		chatMessages[this._id].keyup(this._id, event, instance);
		return instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
	},
	'paste .js-input-message'(e, instance) {
		Meteor.setTimeout(function() {
			const input = instance.find('.js-input-message');
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
	'keydown .js-input-message': firefoxPasteUpload(function(event, t) {
		if ((navigator.platform.indexOf('Mac') !== -1 && event.metaKey) || (navigator.platform.indexOf('Mac') === -1 && event.ctrlKey)) {
			const action = markdownButtons.find(action => action.command === event.key.toLowerCase());
			if (action) {
				applyMd.apply(action, [event, t]);
			}
		}
		return chatMessages[this._id].keydown(this._id, event, Template.instance());
	}),
	'input .js-input-message'(event, instance) {
		instance.sendIcon.set(event.target.value !== '');
		return chatMessages[this._id].valueChanged(this._id, event, Template.instance());
	},
	'propertychange .js-input-message'(event) {
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
	},
	'click .js-md'(e, t) {
		applyMd.apply(this, [e, t]);
	}

});

Template.messageBox.onRendered(function() {
	this.$('.js-input-message').autogrow({
		animate: true,
		onInitialize: true
	}).on('autogrow', () => {
		this.data && this.data.onResize && this.data.onResize();
	});
});

Template.messageBox.onCreated(function() {
	this.isMessageFieldEmpty = new ReactiveVar(true);
	this.showMicButton = new ReactiveVar(false);
	this.showVideoRec = new ReactiveVar(false);
	this.showVideoRec = new ReactiveVar(false);
	this.sendIcon = new ReactiveVar(false);

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
