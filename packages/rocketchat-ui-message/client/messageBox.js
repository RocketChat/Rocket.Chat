/* globals fileUpload KonchatNotification chatMessages popover isRtl */
import toastr from 'toastr';
import moment from 'moment';

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
	if (e.currentTarget.dataset.link) {
		return false;
	}

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

			if (!document.execCommand || !document.execCommand('insertText', false, selectedText)) {
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
	if (!document.execCommand || !document.execCommand('insertText', false, this.pattern.replace('{{text}}', selectedText))) {
		box.value = initText + this.pattern.replace('{{text}}', selectedText) + finalText;
	}

	box.selectionStart = selectionStart + this.pattern.indexOf('{{text}}');
	box.selectionEnd = box.selectionStart + selectedText.length;
	$(box).change();
}


const markdownButtons = [
	{
		label: 'bold',
		icon: 'bold',
		pattern: '*{{text}}*',
		command: 'b',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'original'
	},
	{
		label: 'bold',
		icon: 'bold',
		pattern: '**{{text}}**',
		command: 'b',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'marked'
	},
	{
		label: 'italic',
		icon: 'italic',
		pattern: '_{{text}}_',
		command: 'i',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') !== 'disabled'
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~{{text}}~',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'original'
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~~{{text}}~~',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'marked'
	},
	{
		label: 'inline_code',
		icon: 'code',
		pattern: '`{{text}}`',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') !== 'disabled'
	},
	{
		label: 'multi_line',
		icon: 'multi-line',
		pattern: '```\n{{text}}\n``` ',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') !== 'disabled'
	},
	{
		label: katexSyntax,
		link: 'https://khan.github.io/KaTeX/function-support.html',
		condition: () => RocketChat.katex.katex_enabled()
	}
];

const methods = {
	actions() {
		const groups = RocketChat.messageBox.actions.get();
		return Object.keys(groups).reduce((ret, el) => ret.concat(groups[el]), []);
	}
};

Template.messageBox__actions.helpers(methods);
Template.messageBox__actionsSmall.helpers(methods);
Template.messageBox.helpers({
	mdButtons() {
		return markdownButtons.filter(button => !button.condition || button.condition());
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
	showFormattingTips() {
		return RocketChat.settings.get('Message_ShowFormattingTips');
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
	notSubscribedTpl() {
		return RocketChat.roomTypes.getNotSubscribedTpl(this._id);
	},
	anonymousRead() {
		return (Meteor.userId() == null) && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true;
	},
	anonymousWrite() {
		return (Meteor.userId() == null) && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true && RocketChat.settings.get('Accounts_AllowAnonymousWrite') === true;
	},
	disableSendIcon() {
		return !Template.instance().sendIcon.get() ? 'disabled' : '';
	},
	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	},
	isEmojiEnable() {
		return RocketChat.getUserPreference(Meteor.user(), 'useEmojis');
	},
	isMessageFieldEmpty() {
		return Template.instance().isMessageFieldEmpty.get();
	},
	dataReply() {
		return Template.instance().dataReply.get();
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
	'click .js-message-actions .rc-popover__item, click .js-message-actions .js-message-action'(event, instance) {
		const action = this.action || Template.parentData().action;
		action.apply(this, [{rid: Template.parentData()._id, messageBox: instance.find('.rc-message-box'), element: event.currentTarget, event}]);
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
			instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
			return input.focus();
		});
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
			const action = markdownButtons.find(action => action.command === event.key.toLowerCase() && (!action.condition || action.condition()));
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
	'click .js-md'(e, t) {
		applyMd.apply(this, [e, t]);
	},
	'click .rc-message-box__action-menu'(e) {
		const groups = RocketChat.messageBox.actions.get();
		const textArea = document.querySelector('.rc-message-box__textarea');

		const config = {
			popoverClass: 'message-box',
			columns: [
				{
					groups: Object.keys(groups).map(group => {
						const items = [];
						groups[group].forEach(item => {
							items.push({
								icon: item.icon,
								name: t(item.label),
								type: 'messagebox-action',
								id: item.id
							});
						});
						return {
							title: t(group),
							items
						};
					})
				}
			],
			mousePosition: {
				x: document.querySelector('.rc-message-box__textarea').getBoundingClientRect().right + 10,
				y: document.querySelector('.rc-message-box__textarea').getBoundingClientRect().top
			},
			customCSSProperties: {
				left: isRtl() ? `${ textArea.getBoundingClientRect().left - 10 }px` : undefined
			},
			data: {
				rid: this._id
			},
			activeElement: e.currentTarget
		};

		popover.open(config);
	}
});

Template.messageBox.onRendered(function() {
	const input = $('.rc-message-box__textarea'); //mssg box
	const self = this;
	input.on('dataChange', () => {
		const reply = input.data('reply');
		self.dataReply.set(reply);
	});

	this.autorun(() => {
		if (self.isMessageFieldEmpty.get()) {
			self.dataReply.set(undefined);
		}
	});

	chatMessages[RocketChat.openedRoom] = chatMessages[RocketChat.openedRoom] || new ChatMessages;
	chatMessages[RocketChat.openedRoom].input = this.$('.js-input-message').autogrow({
		animate: true,
		onInitialize: true
	}).on('autogrow', () => {
		this.data && this.data.onResize && this.data.onResize();
	}).focus()[0];

	chatMessages[RocketChat.openedRoom].restoreText(RocketChat.openedRoom);
});

Template.messageBox.onCreated(function() {
	this.dataReply = new ReactiveVar(''); //if user is replying to a mssg, this will contain data of the mssg being replied to
	this.isMessageFieldEmpty = new ReactiveVar(true);
	this.sendIcon = new ReactiveVar(false);
});

Meteor.startup(function() {
	RocketChat.Geolocation = new ReactiveVar(false);
	Tracker.autorun(function() {
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
	RocketChat.callbacks.add('enter-room', function() {
		setTimeout(()=> {
			if (chatMessages[RocketChat.openedRoom].input) {
				chatMessages[RocketChat.openedRoom].input.focus();
			}
		}, 200);
	});
});
